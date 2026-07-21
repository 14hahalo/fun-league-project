import dotenv from 'dotenv';
dotenv.config();

import { playerAnalysisService } from '../services/playerAnalysisService';

const backfillPlayerAnalysis = async () => {
  try {
    console.log('Analiz backfill başlatıldı...');
    const summary = await playerAnalysisService.backfillMissingAnalyses();

    console.log(`İşlenen: ${summary.processed}, Atlanan: ${summary.skipped}, Başarısız: ${summary.failed.length}`);
    if (summary.failed.length > 0) {
      console.log('Başarısız oyuncular (tekil /admin/analysis/regenerate/:playerId ile tekrar denenebilir):');
      summary.failed.forEach(({ playerId, error }) => console.log(`  - ${playerId}: ${error}`));
    }

    process.exit(summary.failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('Backfill başarısız:', error);
    process.exit(1);
  }
};

backfillPlayerAnalysis();
