import { FastifySchema } from 'fastify';

export const ErrorResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    statusCode: { type: 'number' },
    reqId: { type: 'string' },
    error: { type: 'string' },
    details: { type: 'object', additionalProperties: true }
  },
  required: ['success', 'statusCode', 'error']
};

export const StatusSchema: FastifySchema = {
  description: 'Service health and readiness probe',
  tags: ['System'],
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        service: { type: 'string' },
        database: { type: 'string' },
        uptime: { type: 'number' },
        timestamp: { type: 'string' }
      }
    }
  }
};

export const CreateCircleSchema: FastifySchema = {
  description: 'Create a new savings circle',
  tags: ['Circles'],
  body: {
    type: 'object',
    required: ['name', 'creator_address'],
    properties: {
      circle_id: { type: 'string' },
      name: { type: 'string', minLength: 3, maxLength: 255 },
      description: { type: 'string', maxLength: 1000 },
      category: { type: 'string', default: 'General Savings' },
      creator_address: { type: 'string', minLength: 56, maxLength: 64 },
      token_address: { type: 'string', default: 'USDC' },
      contribution_amount: { type: 'number', minimum: 1 },
      interval_days: { type: 'number', minimum: 1, maximum: 365, default: 7 },
      member_count: { type: 'number', minimum: 2, maximum: 100, default: 5 },
      collateral_required: { type: 'number', minimum: 0, default: 50 },
      payout_mode: { type: 'string', enum: ['Fixed', 'Randomized', 'BidBased'], default: 'Fixed' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        circle: { type: 'object', additionalProperties: true }
      }
    },
    400: ErrorResponseSchema
  }
};

export const GetCircleByIdSchema: FastifySchema = {
  description: 'Fetch savings circle details by numeric ID',
  tags: ['Circles'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', pattern: '^[0-9]+$' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        circle: { type: 'object', additionalProperties: true }
      }
    },
    404: ErrorResponseSchema
  }
};

export const JoinCircleSchema: FastifySchema = {
  description: 'Join an active forming circle',
  tags: ['Circles'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', pattern: '^[0-9]+$' }
    }
  },
  body: {
    type: 'object',
    required: ['wallet_address'],
    properties: {
      wallet_address: { type: 'string', minLength: 56, maxLength: 64 },
      collateral_staked: { type: 'number', minimum: 0, default: 0 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        member: { type: 'object', additionalProperties: true }
      }
    },
    400: ErrorResponseSchema
  }
};

export const UpsertProfileSchema: FastifySchema = {
  description: 'Upsert user profile',
  tags: ['Profiles'],
  body: {
    type: 'object',
    required: ['wallet_address'],
    properties: {
      wallet_address: { type: 'string', minLength: 56, maxLength: 64 },
      username: { type: 'string', maxLength: 50 },
      display_name: { type: 'string', maxLength: 100 },
      avatar_url: { type: 'string' },
      bio: { type: 'string', maxLength: 500 },
      email: { type: 'string', format: 'email' },
      reputation_score: { type: 'number' },
      circles_completed: { type: 'number' },
      punctual_contributions: { type: 'number' },
      total_collateral_staked: { type: 'number' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        profile: { type: 'object', additionalProperties: true }
      }
    }
  }
};

export const CreateContributionSchema: FastifySchema = {
  description: 'Record an on-chain cycle contribution',
  tags: ['Contributions'],
  body: {
    type: 'object',
    required: ['circle_id', 'cycle_index', 'member_address', 'amount'],
    properties: {
      circle_id: { type: 'string' },
      cycle_index: { type: 'number', minimum: 0 },
      member_address: { type: 'string', minLength: 56, maxLength: 64 },
      amount: { type: 'number', minimum: 0 },
      tx_hash: { type: 'string' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object', additionalProperties: true }
      }
    }
  }
};

export const RecordPayoutSchema: FastifySchema = {
  description: 'Record pot payout release execution',
  tags: ['Contributions'],
  body: {
    type: 'object',
    required: ['circle_id', 'cycle_index', 'recipient_address'],
    properties: {
      circle_id: { type: 'string' },
      cycle_index: { type: 'number', minimum: 0 },
      recipient_address: { type: 'string', minLength: 56, maxLength: 64 },
      total_pot: { type: 'number' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

export const CreateNotificationSchema: FastifySchema = {
  description: 'Create a user notification',
  tags: ['Notifications'],
  body: {
    type: 'object',
    required: ['wallet_address', 'circle_id', 'message', 'notification_type'],
    properties: {
      wallet_address: { type: 'string', minLength: 56, maxLength: 64 },
      circle_id: { type: 'string' },
      message: { type: 'string' },
      notification_type: { type: 'string' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        notification: { type: 'object', additionalProperties: true }
      }
    }
  }
};
