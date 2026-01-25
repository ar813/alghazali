# Test Script for Search Functionality

## Manual Testing Steps:

1. Visit http://localhost:3000
2. Look for the "Search" link in the navigation bar
3. Click on the "Search" link
4. Verify that you land on the search page with the title "Student Information Search"
5. Verify that the search form has:
   - CNIC/B-Form input field with ID card icon
   - GR Number input field with graduation cap icon
   - Search button
6. Try entering a sample CNIC/B-Form number (e.g., 12345-6789012-3) and GR number
7. Verify that the search functionality attempts to find a student
8. Verify that appropriate error messages appear when no student is found
9. Verify that the page layout is responsive and works on different screen sizes

## Expected Behavior:
- The search page should be accessible from the main navigation
- The search form should validate inputs (13-digit CNIC/B-Form requirement)
- The search should only return results for exact matches of both CNIC/B-Form and GR number
- The page should display clear instructions for users
- Error handling should be user-friendly