import 'dotenv/config'
import cron from 'node-cron'
import { runMonitor } from '@/lib/monitor'

async function start() {
  console.log('Worker started')

  cron.schedule('*/5 * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Monitoring started`)

    try {
      await runMonitor()
      console.log(`[${new Date().toISOString()}] Monitoring finished`)
    } catch (error) {
      console.error('Monitoring error:', error)
    }
  })
}

start().catch((error) => {
  console.error('Worker failed to start:', error)
  process.exit(1)
})