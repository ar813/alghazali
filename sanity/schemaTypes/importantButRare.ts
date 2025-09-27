import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'importantButRare',
  title: 'Important But Rare (Site Settings)',
  type: 'document',
  fields: [
    // Card dates
    defineField({ name: 'cardIssueDate', title: 'Card Issue Date', type: 'date' }),
    defineField({ name: 'cardExpiryDate', title: 'Card Expiry Date', type: 'date' }),

    // Class Fees (store as array of {className, amount}) for easy editing
    defineField({
      name: 'classFees',
      title: 'Class Fees',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'className', title: 'Class Name', type: 'string' }),
          defineField({ name: 'amount', title: 'Amount', type: 'number' }),
        ]
      }]
    }),

    // Contact Info
    defineField({ name: 'schoolAddress', title: 'School Address', type: 'text' }),
    defineField({ name: 'phoneNumber', title: 'Phone Number', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),

    // Office Hours (store as array day->open->close)
    defineField({
      name: 'officeHours',
      title: 'Office Hours',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'day', title: 'Day', type: 'string' }),
          defineField({ name: 'open', title: 'Open', type: 'string' }),
          defineField({ name: 'close', title: 'Close', type: 'string' }),
        ]
      }]
    }),
  ]
})
