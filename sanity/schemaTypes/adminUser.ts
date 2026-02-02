import { defineField, defineType } from 'sanity'
import { UserCog } from 'lucide-react'

export default defineType({
    name: 'adminUser',
    title: 'Admin Users (Backup)',
    type: 'document',
    icon: UserCog,
    fields: [
        defineField({
            name: 'displayName',
            title: 'Display Name',
            type: 'string',
        }),
        defineField({
            name: 'email',
            title: 'Email Address',
            type: 'string',
        }),
        defineField({
            name: 'uid',
            title: 'Firebase UID',
            type: 'string',
            description: 'The unique identifier from Firebase Authentication',
            readOnly: true,
        }),
        defineField({
            name: 'role',
            title: 'Role',
            type: 'string',
            options: {
                list: [
                    { title: 'Admin', value: 'admin' },
                    { title: 'Super Admin', value: 'super_admin' },
                ],
            },
        }),
        defineField({
            name: 'lastSyncedAt',
            title: 'Last Synced At',
            type: 'datetime',
            readOnly: true,
        })
    ],
    preview: {
        select: {
            title: 'displayName',
            subtitle: 'email',
        },
        prepare(selection) {
            const { title, subtitle } = selection
            return {
                title: title || 'Unnamed Admin',
                subtitle: subtitle,
            }
        },
    },
})
