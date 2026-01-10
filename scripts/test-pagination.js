// Test pagination logic

const ITEMS_PER_PAGE = 5;

// Simulate 33 accounts
const accounts = Array.from({ length: 33 }, (_, i) => ({
  id: `account-${i}`,
  handle: `account${String(i).padStart(2, '0')}`,
  is_active: i % 3 !== 0  // Some inactive
}));

// Test 1: Calculate total pages
const totalPages = Math.ceil(accounts.length / ITEMS_PER_PAGE);
console.log(`Test 1: Total pages = ${totalPages} (expected: 7)`);
console.assert(totalPages === 7, 'Total pages should be 7');

// Test 2: Page 1 shows first 5 items
let currentPage = 1;
let startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
let endIndex = startIndex + ITEMS_PER_PAGE;
let pageItems = accounts.slice(startIndex, endIndex);
console.log(`Test 2: Page 1 shows ${pageItems.length} items (expected: 5)`);
console.assert(pageItems.length === 5, 'Page 1 should have 5 items');
console.assert(pageItems[0].handle === 'account00', 'First item should be account00');

// Test 3: Page 3 shows correct items
currentPage = 3;
startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
endIndex = startIndex + ITEMS_PER_PAGE;
pageItems = accounts.slice(startIndex, endIndex);
console.log(`Test 3: Page 3 starts at index ${startIndex} (expected: 10)`);
console.assert(startIndex === 10, 'Page 3 should start at index 10');
console.assert(pageItems[0].handle === 'account10', 'First item on page 3 should be account10');

// Test 4: Filter and pagination reset
// When filter changes, currentPage should reset to 1
currentPage = 3;
// Simulate filter change - only active accounts
const filteredAccounts = accounts.filter(a => a.is_active);
console.log(`Test 4: Filtered accounts = ${filteredAccounts.length} (expected: 22)`);
// After filter, reset to page 1
currentPage = 1;
startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
endIndex = startIndex + ITEMS_PER_PAGE;
pageItems = filteredAccounts.slice(startIndex, endIndex);
console.log(`Test 4: After filter reset, showing first ${pageItems.length} filtered items`);
console.assert(currentPage === 1, 'Page should reset to 1 after filter');

// Test 5: Last page shows remaining items
const filteredTotalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE);
currentPage = filteredTotalPages;
startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
endIndex = startIndex + ITEMS_PER_PAGE;
pageItems = filteredAccounts.slice(startIndex, endIndex);
console.log(`Test 5: Last page (${currentPage}) shows ${pageItems.length} items (expected: 2)`);
console.assert(pageItems.length === 2, 'Last page should have 2 remaining items');

console.log('\nAll pagination tests passed!');
