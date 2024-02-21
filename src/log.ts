type LogFunc = (message: string) => void
export const info: LogFunc = message => console.info('[GITHUB NOTIFICATIONS EXTENSION][INFO] ' + message)
export const error: LogFunc = message => console.error('[GITHUB NOTIFICATIONS EXTENSION][ERROR] ' + message)
