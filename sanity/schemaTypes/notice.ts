import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'notice',
  title: 'Notice',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'session', title: 'Academic Session', type: 'string', initialValue: '2025-2026' }),
    defineField({ name: 'content', title: 'Content', type: 'text', validation: (r) => r.required() }),
    defineField({ name: 'createdAt', title: 'Created At', type: 'datetime', initialValue: () => new Date().toISOString() }),
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
      validation: (r) => r.required()
    }),
    defineField({ name: 'className', title: 'Class Name', type: 'string' }),
    defineField({ name: 'student', title: 'Student', type: 'reference', to: [{ type: 'student' }] }),
    defineField({ name: 'sendEmail', title: 'Send Email', type: 'boolean', initialValue: false }),
    // Event-related fields
    defineField({ name: 'isEvent', title: 'Is Event', type: 'boolean', initialValue: false }),
    defineField({ name: 'eventDate', title: 'Event Date', type: 'datetime' }),
    defineField({ name: 'eventType', title: 'Event Type', type: 'string' }),
    // Headline-related field
    defineField({ name: 'isHeadline', title: 'Is Headline', type: 'boolean', initialValue: false }),
  ],
})
