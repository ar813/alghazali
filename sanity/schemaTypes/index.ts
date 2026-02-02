import { type SchemaTypeDefinition } from 'sanity'
import student from './student'
import adminUser from './adminUser'
import schedule from './schedule'
import fees from './fees'
import notice from './notice'
import quiz from './quiz'
import quizResult from './quizResult'
import examResultSet from './examResultSet'
import sessionMeta from './sessionMeta'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [student, adminUser, schedule, fees, notice, quiz, quizResult, examResultSet, sessionMeta],
}
