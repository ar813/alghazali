import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'quiz',
  title: 'Quiz',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'session', title: 'Academic Session', type: 'string', initialValue: '2024-2025' }),
    defineField({ name: 'subject', title: 'Subject', type: 'string', validation: r => r.required() }),
    defineField({ name: 'examKey', title: 'Exam Key', type: 'string', validation: r => r.required() }),
    defineField({ name: 'createdAt', title: 'Created At', type: 'datetime', initialValue: () => new Date().toISOString() }),
    defineField({ name: 'durationMinutes', title: 'Duration (minutes)', type: 'number', validation: r => r.min(1).max(600) }),
    defineField({ name: 'questionLimit', title: 'Question Limit (show only this many to student)', type: 'number', validation: r => r.min(1).max(200) }),
    defineField({
      name: 'targetType',
      title: 'Target Type',
      type: 'string',
      options: {
        list: [
          { title: 'All School', value: 'all' },
          { title: 'Class', value: 'class' },
          { title: 'Student', value: 'student' },
        ]
      },
      validation: r => r.required()
    }),
    defineField({ name: 'className', title: 'Class Name', type: 'string' }),
    defineField({ name: 'student', title: 'Student', type: 'reference', to: [{ type: 'student' }] }),
    defineField({
      name: 'questions',
      title: 'Questions',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'question', title: 'Question', type: 'text', validation: r => r.required() }),
          defineField({ name: 'options', title: 'Options', type: 'array', of: [{ type: 'string' }], validation: r => r.min(4).max(4) }),
          defineField({ name: 'correctIndex', title: 'Correct Option Index (0-3)', type: 'number', validation: r => r.min(0).max(3) }),
          defineField({
            name: 'difficulty',
            title: 'Difficulty',
            type: 'string',
            options: {
              list: [
                { title: 'Easy', value: 'easy' },
                { title: 'Medium', value: 'medium' },
                { title: 'Hard', value: 'hard' },
              ]
            },
            initialValue: 'easy'
          }),
        ]
      }],
      validation: r => r.min(1)
    }),
    defineField({ name: 'resultsAnnounced', title: 'Results Announced', type: 'boolean', initialValue: false }),
  ],
})
