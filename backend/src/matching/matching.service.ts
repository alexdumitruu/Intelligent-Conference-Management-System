import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Paper } from '../papers/entities/paper.entity';
import { User } from '../users/entities/user.entity';
import { Bid, BidType } from './entities/bid.entity';
import { Conflict } from './entities/conflict.entity';
import { Review } from '../reviews/entities/review.entity';
import { Conference } from '../conferences/entities/conference.entity';
import {
  ConferenceRole,
  ConferenceRoleType,
} from '../conferences/entities/conference-role.entity';
import { PaperStatus } from '../papers/entities/paper-history.entity';
import { PaperAuthor } from '../papers/entities/paper-author.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { CreateConflictDto } from './dto/create-conflict.dto';
import * as natural from 'natural';

export const MAX_REVIEWS_PER_PAPER = 3;
const MAX_REVIEWS_PER_REVIEWER = 5;

@Injectable()
export class MatchingService {
  constructor(
    @InjectModel(Paper)
    private readonly paperModel: typeof Paper,
    @InjectModel(Bid)
    private readonly bidModel: typeof Bid,
    @InjectModel(Conflict)
    private readonly conflictModel: typeof Conflict,
    @InjectModel(Review)
    private readonly reviewModel: typeof Review,
    @InjectModel(ConferenceRole)
    private readonly conferenceRoleModel: typeof ConferenceRole,
    @InjectModel(Conference)
    private readonly conferenceModel: typeof Conference,
  ) {}

  preprocessText(text: string): string[] {
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text.toLowerCase());
    if (!tokens) return [];

    const stopwords = natural.stopwords;
    const filtered = tokens.filter(
      (token) => !stopwords.includes(token) && token.length > 1,
    );

    return filtered.map((token) => natural.PorterStemmer.stem(token));
  }

  calculateTfIdf(documents: string[][]): number[][] {
    const vocabulary: string[] = [];
    const vocabSet = new Set<string>();

    for (const doc of documents) {
      for (const term of doc) {
        if (!vocabSet.has(term)) {
          vocabSet.add(term);
          vocabulary.push(term);
        }
      }
    }

    const numDocs = documents.length;
    const numTerms = vocabulary.length;

    const docFrequency = new Array(numTerms).fill(0);
    for (const doc of documents) {
      const uniqueTerms = new Set(doc);
      for (let t = 0; t < numTerms; t++) {
        if (uniqueTerms.has(vocabulary[t])) {
          docFrequency[t]++;
        }
      }
    }

    const idf = docFrequency.map((df) => (df > 0 ? Math.log(numDocs / df) : 0));

    const tfidfMatrix: number[][] = [];
    for (const doc of documents) {
      const termCounts = new Map<string, number>();
      for (const term of doc) {
        termCounts.set(term, (termCounts.get(term) || 0) + 1);
      }
      const docLength = doc.length;
      const vector = new Array(numTerms).fill(0);
      for (let t = 0; t < numTerms; t++) {
        const count = termCounts.get(vocabulary[t]) || 0;
        const tf = docLength > 0 ? count / docLength : 0;
        vector[t] = tf * idf[t];
      }
      tfidfMatrix.push(vector);
    }

    return tfidfMatrix;
  }

  calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private detectInstitutionalConflicts(
    papers: Paper[],
    reviewerRoles: ConferenceRole[],
    conflictSet: Set<string>,
  ): void {
    const genericDomains = new Set([
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'protonmail.com',
      'icloud.com',
      'test.com',
      'example.com',
      'localhost',
    ]);

    const getDomain = (email: string): string => {
      const parts = email.split('@');
      return parts.length === 2 ? parts[1].toLowerCase() : '';
    };

    const reviewerDomains = new Map<number, string>();
    for (const role of reviewerRoles) {
      if (role.user?.email) {
        reviewerDomains.set(role.userId, getDomain(role.user.email));
      }
    }

    for (const paper of papers) {
      if (!paper.authors) continue;

      const authorDomains = paper.authors
        .filter((a) => a.user?.email)
        .map((a) => getDomain(a.user.email));

      for (const role of reviewerRoles) {
        const reviewerDomain = reviewerDomains.get(role.userId);
        if (!reviewerDomain || genericDomains.has(reviewerDomain)) continue;

        for (const authorDomain of authorDomains) {
          if (!authorDomain || genericDomains.has(authorDomain)) continue;
          if (authorDomain === reviewerDomain) {
            conflictSet.add(`${paper.id}-${role.userId}`);
            break;
          }
        }
      }
    }
  }

  async executeGreedyAssignment(
    conferenceId: number,
    maxReviewsPerPaper: number,
  ): Promise<Review[]> {
    const papers = await this.paperModel.findAll({
      where: { conferenceId, status: PaperStatus.BIDDING },
      include: [{ model: PaperAuthor, include: [User] }],
    });

    const reviewerRoles = await this.conferenceRoleModel.findAll({
      where: { conferenceId, roleType: ConferenceRoleType.REVIEWER },
      include: [User],
    });

    const conflicts = await this.conflictModel.findAll({
      where: {
        paperId: papers.map((p) => p.id),
      },
    });

    const bids = await this.bidModel.findAll({
      where: {
        paperId: papers.map((p) => p.id),
      },
    });

    const conflictSet = new Set(
      conflicts.map((c) => `${c.paperId}-${c.userId}`),
    );

    this.detectInstitutionalConflicts(papers, reviewerRoles, conflictSet);

    const authorSet = new Set<string>();
    for (const paper of papers) {
      if (paper.authors) {
        for (const author of paper.authors) {
          authorSet.add(`${paper.id}-${author.userId}`);
        }
      }
    }

    const bidMap = new Map<string, BidType>();
    for (const bid of bids) {
      bidMap.set(`${bid.paperId}-${bid.userId}`, bid.bidType);
    }

    const reviewerBidAbstracts = new Map<number, string[]>();
    for (const bid of bids) {
      if (bid.bidType === BidType.YES) {
        const paper = papers.find((p) => p.id === bid.paperId);
        if (paper) {
          const existing = reviewerBidAbstracts.get(bid.userId) || [];
          existing.push(paper.abstract);
          reviewerBidAbstracts.set(bid.userId, existing);
        }
      }
    }

    const allDocuments: string[][] = [];
    const paperIndices: number[] = [];
    const reviewerIndices: number[] = [];

    for (let i = 0; i < papers.length; i++) {
      allDocuments.push(this.preprocessText(papers[i].abstract));
      paperIndices.push(allDocuments.length - 1);
    }

    for (const role of reviewerRoles) {
      const abstracts = reviewerBidAbstracts.get(role.userId);
      const reviewerText = abstracts ? abstracts.join(' ') : '';
      allDocuments.push(this.preprocessText(reviewerText));
      reviewerIndices.push(allDocuments.length - 1);
    }

    const tfidfMatrix = this.calculateTfIdf(allDocuments);

    const scoredPairs: {
      paperId: number;
      userId: number;
      score: number;
    }[] = [];

    const totalPossiblePairs = papers.length * reviewerRoles.length;
    let filteredByConflict = 0;
    let filteredByAuthor = 0;
    let filteredByNoBid = 0;

    for (let pi = 0; pi < papers.length; pi++) {
      const paper = papers[pi];
      const paperVec = tfidfMatrix[paperIndices[pi]];

      for (let ri = 0; ri < reviewerRoles.length; ri++) {
        const reviewer = reviewerRoles[ri];
        const pairKey = `${paper.id}-${reviewer.userId}`;

        if (conflictSet.has(pairKey)) {
          filteredByConflict++;
          continue;
        }
        if (authorSet.has(pairKey)) {
          filteredByAuthor++;
          continue;
        }

        const bidType = bidMap.get(pairKey);
        if (bidType === BidType.NO) {
          filteredByNoBid++;
          continue;
        }

        const reviewerVec = tfidfMatrix[reviewerIndices[ri]];
        const cosineSim = this.calculateCosineSimilarity(paperVec, reviewerVec);

        let score = 0.05 + cosineSim;

        if (bidType === BidType.YES) {
          score += 0.15;
        } else if (bidType === BidType.MAYBE) {
          score += 0.05;
        }

        scoredPairs.push({
          paperId: paper.id,
          userId: reviewer.userId,
          score,
        });
      }
    }

    console.log(`[Matcher] Total possible pairs: ${totalPossiblePairs}`);
    console.log(`[Matcher] Filtered by conflict: ${filteredByConflict}`);
    console.log(`[Matcher] Filtered by author overlap: ${filteredByAuthor}`);
    console.log(`[Matcher] Filtered by NO bid: ${filteredByNoBid}`);
    console.log(
      `[Matcher] Eligible pairs for assignment: ${scoredPairs.length}`,
    );

    scoredPairs.sort((a, b) => b.score - a.score);

    const reviewsPerPaper = new Map<number, number>();
    const reviewsPerReviewer = new Map<number, number>();
    const createdReviews: Review[] = [];

    for (const pair of scoredPairs) {
      const paperCount = reviewsPerPaper.get(pair.paperId) || 0;
      const reviewerCount = reviewsPerReviewer.get(pair.userId) || 0;

      if (
        paperCount >= maxReviewsPerPaper ||
        reviewerCount >= MAX_REVIEWS_PER_REVIEWER
      ) {
        continue;
      }

      const review = await this.reviewModel.create({
        paperId: pair.paperId,
        userId: pair.userId,
        score: 0,
        confidence: 0,
        contentAuthors: '',
        contentChair: '',
      });

      createdReviews.push(review);
      reviewsPerPaper.set(pair.paperId, paperCount + 1);
      reviewsPerReviewer.set(pair.userId, reviewerCount + 1);
    }

    console.log(`[Matcher] Reviews created: ${createdReviews.length}`);
    return createdReviews;
  }

  async getPapersForBidding(
    conferenceId: number,
    userId: number,
  ): Promise<Paper[]> {
    const conference = await this.conferenceModel.findByPk(conferenceId);
    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

    const dynamicInclude: any[] = [];
    if (!conference.isDoubleBlind) {
      dynamicInclude.push({
        model: PaperAuthor,
        include: [
          {
            model: User,
            attributes: ['id', 'firstName', 'lastName', 'affiliation'],
          },
        ],
      });
    }

    return this.paperModel.findAll({
      where: { conferenceId, status: PaperStatus.BIDDING },
      attributes: [
        'id',
        'title',
        'abstract',
        'keywords',
        'topics',
        'createdAt',
      ],
      include: dynamicInclude,
    });
  }

  async submitBid(
    conferenceId: number,
    userId: number,
    dto: CreateBidDto,
  ): Promise<Bid> {
    const paper = await this.paperModel.findByPk(dto.paperId);
    if (!paper || paper.conferenceId !== conferenceId) {
      throw new NotFoundException('Paper not found in this conference');
    }

    if (paper.status !== PaperStatus.BIDDING) {
      throw new BadRequestException(
        'Paper must be in BIDDING status to accept bids',
      );
    }

    await this.bidModel.upsert({
      paperId: dto.paperId,
      userId,
      bidType: dto.bidType,
    });

    const bid = await this.bidModel.findOne({
      where: { paperId: dto.paperId, userId },
    });
    return bid!;
  }

  async declareConflict(
    conferenceId: number,
    userId: number,
    dto: CreateConflictDto,
  ): Promise<Conflict> {
    const paper = await this.paperModel.findByPk(dto.paperId);
    if (!paper || paper.conferenceId !== conferenceId) {
      throw new NotFoundException('Paper not found in this conference');
    }

    const [conflict, created] = await this.conflictModel.findOrCreate({
      where: { paperId: dto.paperId, userId },
      defaults: { paperId: dto.paperId, userId, reason: dto.reason },
    });

    if (!created) {
      throw new BadRequestException(
        'You have already declared a conflict for this paper',
      );
    }

    return conflict;
  }

  async retractConflict(
    conferenceId: number,
    userId: number,
    paperId: number,
  ): Promise<void> {
    const paper = await this.paperModel.findByPk(paperId);
    if (!paper || paper.conferenceId !== conferenceId) {
      throw new NotFoundException('Paper not found in this conference');
    }
    const conflict = await this.conflictModel.findOne({
      where: { paperId, userId },
    });
    if (!conflict) {
      throw new NotFoundException('Conflict declaration not found');
    }
    await conflict.destroy();
  }

  async getAssignedPapers(
    conferenceId: number,
    userId: number,
  ): Promise<Paper[]> {
    const reviews = await this.reviewModel.findAll({
      where: { userId },
      include: [
        {
          model: Paper,
          where: { conferenceId },
          attributes: ['id', 'title', 'abstract', 'status', 'rebuttalText'],
        },
      ],
    });
    return reviews.map((r) => {
      const p = r.paper.toJSON();
      return { ...p, currentUserReview: { score: r.score } } as Paper;
    });
  }
}
