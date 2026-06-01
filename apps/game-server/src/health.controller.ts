import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  public health(): { status: string; botAiUrl: string } {
    return {
      status: 'ok',
      botAiUrl: process.env.BOT_AI_URL ?? 'http://localhost:8000',
    };
  }
}
