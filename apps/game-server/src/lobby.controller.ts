/**
 * lobby.controller.ts — HTTP lobby endpoints.
 */

import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { LobbyService } from './lobby.service.js';
import { EngineError } from '../../../src/engine/EngineError.js';
import type { PlayerId } from '../../../src/types/enums.js';

@Controller()
export class LobbyController {
  public constructor(private readonly lobby: LobbyService) {}

  @Get('health')
  public health(): { status: string } {
    return { status: 'ok' };
  }

  @Post('lobby/create')
  public async create(@Body() body: { displayName: string }) {
    try {
      return await this.lobby.createLobby(body.displayName ?? 'Player');
    } catch (err: unknown) {
      throw mapEngineError(err);
    }
  }

  @Post('lobby/join')
  public async join(
    @Body() body: { roomCode: string; displayName: string },
  ) {
    try {
      return await this.lobby.joinLobby(body.roomCode, body.displayName ?? 'Player');
    } catch (err: unknown) {
      throw mapEngineError(err);
    }
  }

  @Post('lobby/start')
  public async start(
    @Body()
    body: {
      roomId: string;
      playerId: PlayerId;
      playerIds: PlayerId[];
      displayNames: Record<PlayerId, string>;
    },
  ) {
    try {
      return await this.lobby.startLobby(
        body.roomId,
        body.playerId,
        body.playerIds,
        body.displayNames,
      );
    } catch (err: unknown) {
      throw mapEngineError(err);
    }
  }
}

function mapEngineError(err: unknown): HttpException {
  if (err instanceof EngineError) {
    const status =
      err.code === 'ROOM_NOT_FOUND'
        ? HttpStatus.NOT_FOUND
        : err.code === 'UNAUTHORIZED_ACTION'
          ? HttpStatus.FORBIDDEN
          : HttpStatus.BAD_REQUEST;
    return new HttpException({ code: err.code, message: err.message }, status);
  }
  return new HttpException('Internal error', HttpStatus.INTERNAL_SERVER_ERROR);
}
