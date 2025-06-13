async function scrapePage(page, pageNum) {
    console.log(`Scraping page ${pageNum}...`);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Try multiple selectors for games
    const gameSelectors = [
        '.game-item',
        '.game-card',
        '[data-game-id]',
        '.game',
        '.item',
        'article',
        '.catalog-item'
    ];
    
    let games = [];
    
    // Try each selector until we find games
    for (const selector of gameSelectors) {
        console.log(`Trying selector: ${selector}`);
        await page.waitForTimeout(2000); // Wait for potential dynamic loading
        
        const elements = await page.$$(selector);
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        
        if (elements.length > 0) {
            // Debug: log the HTML structure of first few elements
            for (let i = 0; i < Math.min(3, elements.length); i++) {
                const html = await elements[i].innerHTML();
                console.log(`Element ${i} HTML:`, html.substring(0, 200) + '...');
            }
            
            // Try to extract game data
            games = await page.evaluate((sel) => {
                const elements = document.querySelectorAll(sel);
                const gameData = [];
                
                elements.forEach((element, index) => {
                    try {
                        // Try multiple ways to extract game info
                        const titleSelectors = ['h3', 'h4', '.title', '.name', '[data-title]', 'a'];
                        const imageSelectors = ['img', '.image', '.thumbnail'];
                        const linkSelectors = ['a', '[href]'];
                        
                        let title = '';
                        let image = '';
                        let link = '';
                        
                        // Extract title
                        for (const titleSel of titleSelectors) {
                            const titleEl = element.querySelector(titleSel);
                            if (titleEl && titleEl.textContent.trim()) {
                                title = titleEl.textContent.trim();
                                break;
                            }
                        }
                        
                        // Extract image
                        for (const imgSel of imageSelectors) {
                            const imgEl = element.querySelector(imgSel);
                            if (imgEl) {
                                image = imgEl.src || imgEl.dataset.src || imgEl.getAttribute('data-lazy-src') || '';
                                if (image) break;
                            }
                        }
                        
                        // Extract link
                        for (const linkSel of linkSelectors) {
                            const linkEl = element.querySelector(linkSel);
                            if (linkEl && linkEl.href) {
                                link = linkEl.href;
                                break;
                            }
                        }
                        
                        // If we found at least a title or link, add it
                        if (title || link) {
                            gameData.push({
                                title: title || `Game ${index + 1}`,
                                image: image,
                                link: link,
                                source: 'gamedistribution'
                            });
                        }
                    } catch (err) {
                        console.log(`Error processing element ${index}:`, err.message);
                    }
                });
                
                return gameData;
            }, selector);
            
            if (games.length > 0) {
                console.log(`Successfully extracted ${games.length} games using selector: ${selector}`);
                break;
            }
        }
    }
    
    // If no games found with standard selectors, try a more general approach
    if (games.length === 0) {
        console.log('No games found with standard selectors, trying general approach...');
        
        // Look for any links that might be games
        games = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href*="/game"]'));
            const gameData = [];
            
            links.forEach((link, index) => {
                if (link.href && link.textContent.trim()) {
                    gameData.push({
                        title: link.textContent.trim(),
                        image: '',
                        link: link.href,
                        source: 'gamedistribution'
                    });
                }
            });
            
            return gameData.slice(0, 20); // Limit to first 20
        });
        
        console.log(`Found ${games.length} games using general approach`);
    }
    
    console.log(`Found ${games.length} games on page ${pageNum}`);
    
    // Log first few games for debugging
    if (games.length > 0) {
        console.log('Sample games found:');
        games.slice(0, 3).forEach((game, i) => {
            console.log(`  ${i + 1}. ${game.title} - ${game.link}`);
        });
    } else {
        // Debug: log page content to understand structure
        const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
        console.log('Page content sample:', bodyText);
        
        const allLinks = await page.evaluate(() => 
            Array.from(document.querySelectorAll('a')).map(a => a.href).slice(0, 10)
        );
        console.log('Sample links found:', allLinks);
    }
    
    return games;
}