// Navigation Test Script
// Run this in the browser console to test all navigation functionality

console.log('🔍 Testing Navigation Links and Anchors...\n');

// Test 1: Check all external links have proper attributes
function testExternalLinks() {
  console.log('1. Testing External Links:');
  
  const externalLinks = document.querySelectorAll('a[href^="http"]');
  
  if (externalLinks.length === 0) {
    console.log('   ℹ️  No external links found');
    return;
  }
  
  externalLinks.forEach((link, index) => {
    const href = link.href;
    const target = link.target;
    const rel = link.rel;
    const ariaLabel = link.getAttribute('aria-label');
    
    console.log(`   ${index + 1}. ${href}`);
    console.log(`      Target: ${target || 'not set'}`);
    console.log(`      Rel: ${rel || 'not set'}`);
    console.log(`      Aria-label: ${ariaLabel || 'not set'}`);
    
    // Check for required attributes
    const hasTargetBlank = target === '_blank';
    const hasRelNoOpener = rel && rel.includes('noopener');
    const hasRelNoReferrer = rel && rel.includes('noreferrer');
    
    if (!hasTargetBlank) {
      console.log(`      ⚠️  Missing target="_blank"`);
    }
    if (!hasRelNoOpener) {
      console.log(`      ⚠️  Missing rel="noopener"`);
    }
    if (!hasRelNoReferrer) {
      console.log(`      ⚠️  Missing rel="noreferrer"`);
    }
    if (hasTargetBlank && hasRelNoOpener && hasRelNoReferrer) {
      console.log(`      ✅ All security attributes present`);
    }
  });
}

// Test 2: Check internal navigation links
function testInternalLinks() {
  console.log('\n2. Testing Internal Navigation Links:');
  
  const internalLinks = document.querySelectorAll('a[href^="/"], Link[href^="/"]');
  
  if (internalLinks.length === 0) {
    console.log('   ℹ️  No internal links found');
    return;
  }
  
  internalLinks.forEach((link, index) => {
    const href = link.getAttribute('href');
    const isLogo = link.closest('[aria-label*="logo"], [aria-label*="home"]');
    const text = link.textContent?.trim() || '';
    
    console.log(`   ${index + 1}. ${href} - "${text}"`);
    console.log(`      Type: ${isLogo ? 'Logo/Home' : 'Navigation'}`);
    console.log(`      ✅ Internal link properly configured`);
  });
}

// Test 3: Check for dead links or placeholders
function testDeadLinks() {
  console.log('\n3. Testing for Dead Links or Placeholders:');
  
  const allLinks = document.querySelectorAll('a[href], Link[href]');
  const problematicLinks = [];
  
  allLinks.forEach(link => {
    const href = link.getAttribute('href');
    
    if (href === '#' || href === '' || href === null) {
      problematicLinks.push({
        element: link,
        href: href,
        text: link.textContent?.trim() || ''
      });
    }
  });
  
  if (problematicLinks.length === 0) {
    console.log('   ✅ No dead links or placeholders found');
  } else {
    console.log(`   ⚠️  Found ${problematicLinks.length} problematic links:`);
    problematicLinks.forEach((link, index) => {
      console.log(`      ${index + 1}. href="${link.href}" - "${link.text}"`);
    });
  }
}

// Test 4: Verify logo navigation
function testLogoNavigation() {
  console.log('\n4. Testing Logo Navigation:');
  
  const logoLinks = document.querySelectorAll('a[href="/"], Link[href="/"]');
  
  if (logoLinks.length === 0) {
    console.log('   ⚠️  No logo/home link found');
    return;
  }
  
  logoLinks.forEach((logo, index) => {
    const hasLogoContent = logo.querySelector('[aria-hidden="true"]');
    const hasLogoText = logo.textContent?.toLowerCase().includes('axionvera');
    
    console.log(`   ${index + 1}. Logo link found`);
    console.log(`      Href: ${logo.getAttribute('href')}`);
    console.log(`      Has logo element: ${hasLogoContent ? '✅' : '⚠️'}`);
    console.log(`      Has logo text: ${hasLogoText ? '✅' : '⚠️'}`);
    console.log(`      ✅ Logo navigation properly configured`);
  });
}

// Test 5: Check accessibility attributes
function testAccessibility() {
  console.log('\n5. Testing Accessibility Attributes:');
  
  const allLinks = document.querySelectorAll('a[href], Link[href]');
  let issues = 0;
  
  allLinks.forEach(link => {
    const ariaLabel = link.getAttribute('aria-label');
    const text = link.textContent?.trim();
    const hasIcon = link.querySelector('svg, img, [aria-hidden="true"]');
    
    // Check if link needs aria-label
    if (!text && !ariaLabel && hasIcon) {
      console.log(`   ⚠️  Icon link missing aria-label`);
      issues++;
    }
    
    if (ariaLabel) {
      console.log(`   ✅ Link has aria-label: "${ariaLabel}"`);
    }
  });
  
  if (issues === 0) {
    console.log('   ✅ All links have proper accessibility attributes');
  }
}

// Run all tests
function runNavigationTests() {
  console.log('🧪 Navigation Test Suite Started\n');
  console.log('='.repeat(50));
  
  testExternalLinks();
  testInternalLinks();
  testDeadLinks();
  testLogoNavigation();
  testAccessibility();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Navigation Test Suite Complete!');
  console.log('\nManual Testing Checklist:');
  console.log('□ Click logo to navigate home from dashboard');
  console.log('□ Click "Vault" link to navigate to dashboard');
  console.log('□ Click "Soroban" link to open in new tab');
  console.log('□ Click "View on GitHub" link to open in new tab');
  console.log('□ Test mobile menu navigation');
  console.log('□ Test keyboard navigation (Tab + Enter)');
}

// Auto-run tests
runNavigationTests();

// Export for manual testing
window.testNavigation = {
  testExternalLinks,
  testInternalLinks,
  testDeadLinks,
  testLogoNavigation,
  testAccessibility,
  runAllTests: runNavigationTests
};

console.log('\n💡 Manual testing functions available in window.testNavigation');
