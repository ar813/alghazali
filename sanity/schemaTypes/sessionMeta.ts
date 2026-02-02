import { defineType, defineField } from 'sanity'

export default defineType({
    name: 'sessionMeta',
    title: 'Session Metadata',
    type: 'document',
    fields: [
        defineField({
            name: 'sessionName',
            title: 'Session Name',
            type: 'string',
            validation: Rule => Rule.required()
        }),
        defineField({
            name: 'createdAt',
            title: 'Created At',
            type: 'datetime'
        }),
        defineField({
            name: 'createdBy',
            title: 'Created By',
            type: 'string'
        })
    ],
    preview: {
        select: {
            title: 'sessionName',
            subtitle: 'createdAt'
        }
    }
})
