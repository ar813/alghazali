# Parent/Guardian Student Search Feature

## Overview
This feature adds a secure search page that allows parents or guardians to search for their children's information using their CNIC/B-Form number and GR number. This provides a way for families to access their children's academic information without needing admin credentials.

## Features
- Secure search using two identifying factors (CNIC/B-Form and GR number)
- Formatted input for CNIC/B-Form numbers (automatically adds dashes)
- Detailed student information display when found
- Responsive design that works on all devices
- Clear instructions for users
- Error handling for invalid inputs or no results

## How It Works
1. Parents/guardians visit the `/search` page
2. Enter the 13-digit CNIC/B-Form number (with or without dashes)
3. Enter the GR number assigned to their child
4. Click "Search Student" to find their child's information
5. If found, detailed student information is displayed securely

## Security Measures
- Requires both CNIC/B-Form and GR number for verification
- Only returns information for exact matches
- No authentication required, but strict identification requirements

## Technical Implementation
- Uses Sanity CMS for data storage and retrieval
- Implements client-side validation
- Follows the same data structure as the existing student management system
- Integrates seamlessly with existing UI components and design system

## Files Created/Modified
- `app/search/page.tsx` - The main search page component
- `components/NavBar/NavBar.tsx` - Added "Search" link to navigation
- `utils/helpers.ts` - Added `onlyDigits` utility function
- `sanity/lib/queries.ts` - Added `getStudentByCnicAndGr` query

## Integration
The search page follows the same design patterns as the rest of the application and integrates with the existing student data model. It shares the same Student type definition and uses the same data fields as other parts of the system.