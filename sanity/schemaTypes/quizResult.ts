import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'quizResult',
  title: 'Quiz Result',
  type: 'document',
  fields: [
    defineField({ name: 'quiz', title: 'Quiz', type: 'reference', to: [{ type: 'quiz' }], validation: r => r.required() }),
    defineField({ name: 'student', title: 'Student', type: 'reference', to: [{ type: 'student' }], validation: r => r.required() }),
    // denormalized student info for quick reporting
    defineField({ name: 'studentName', title: 'Student Name', type: 'string' }),
    defineField({ name: 'studentGrNumber', title: 'GR Number', type: 'string' }),
    defineField({ name: 'studentRollNumber', title: 'Roll Number', type: 'string' }),
    defineField({ name: 'className', title: 'Class', type: 'string' }),
    defineField({ name: 'studentEmail', title: 'Email', type: 'string' }),
    defineField({ name: 'answers', title: 'Answers (selected index per question)', type: 'array', of: [{ type: 'number' }], validation: r => r.min(1) }),
    defineField({ name: 'score', title: 'Score', type: 'number', validation: r => r.min(0) }),
    defineField({ name: 'submittedAt', title: 'Submitted At', type: 'datetime', initialValue: () => new Date().toISOString() }),
  ],
})
