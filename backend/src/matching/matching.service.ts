import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Paper } from '../papers/entities/paper.entity';
import { Bid, BidType } from './entities/bid.entity';
import { Conflict } from './entities/conflict.entity';
import { Review } from '../reviews/entities/review.entity';
import {
  ConferenceRole,
  ConferenceRoleType,
} from '../conferences/entities/conference-role.entity';
import { PaperStatus } from '../papers/entities/paper-history.entity';
import { PaperAuthor } from '../papers/entities/paper-author.entity';
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

  async executeGreedyAssignment(
    conferenceId: number,
    maxReviewsPerPaper: number,
  ): Promise<Review[]> {
    const papers = await this.paperModel.findAll({
      where: { conferenceId, status: PaperStatus.BIDDING },
      include: [PaperAuthor],
    });

    const reviewerRoles = await this.conferenceRoleModel.findAll({
      where: { conferenceId, roleType: ConferenceRoleType.REVIEWER },
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
      if (bid.bidType === BidType.POSITIVE) {
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

    for (let pi = 0; pi < papers.length; pi++) {
      const paper = papers[pi];
      const paperVec = tfidfMatrix[paperIndices[pi]];

      for (let ri = 0; ri < reviewerRoles.length; ri++) {
        const reviewer = reviewerRoles[ri];
        const pairKey = `${paper.id}-${reviewer.userId}`;

        if (conflictSet.has(pairKey)) continue;
        if (authorSet.has(pairKey)) continue;

        const bidType = bidMap.get(pairKey);
        if (bidType === BidType.NEGATIVE) continue;

        const reviewerVec = tfidfMatrix[reviewerIndices[ri]];
        let similarity = this.calculateCosineSimilarity(paperVec, reviewerVec);

        if (bidType === BidType.POSITIVE) {
          similarity += 0.15;
        }

        scoredPairs.push({
          paperId: paper.id,
          userId: reviewer.userId,
          score: similarity,
        });
      }
    }

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

    return createdReviews;
  }
}
