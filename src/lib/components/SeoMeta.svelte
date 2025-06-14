<script>
    export let title = "FreeWebGames Store - Your Next Game Is Just One Click Away";
    export let description = "Discover thousands of free online games including action, puzzle, strategy, adventure, and casual games. Play instantly in your browser without downloads or registration!";
    export let keywords = "free games,online games,browser games,HTML5 games,flash games,action games,puzzle games,strategy games";
    export let canonical = "https://freegamestoplayonline.store";
    export let ogType = "website";
    export let ogImage = "https://freegamestoplayonline.store/og-image.jpg";
    export let twitterCard = "summary_large_image";
    export let publishedTime = "";
    export let modifiedTime = "";
    export let category = "";
    export let structuredData = null;
    
    // Generate current date if not provided
    $: currentDate = new Date().toISOString().split('T')[0];
    $: publishDate = publishedTime || currentDate;
    $: modifiedDate = modifiedTime || currentDate;
    
    // Default structured data for a webpage
    $: defaultStructuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": title,
        "description": description,
        "url": canonical,
        "datePublished": publishDate,
        "dateModified": modifiedDate
    };
    
    // Use provided structured data or default
    $: finalStructuredData = structuredData || defaultStructuredData;
</script>

<!-- 基本SEO元标签 -->
<title>{title}</title>
<meta name="description" content={description}>
<meta name="keywords" content={keywords}>

<!-- 规范链接 -->
<link rel="canonical" href={canonical}>

<!-- Open Graph 标签 -->
<meta property="og:title" content={title}>
<meta property="og:description" content={description}>
<meta property="og:type" content={ogType}>
<meta property="og:url" content={canonical}>
<meta property="og:image" content={ogImage}>
<meta property="og:site_name" content="FreeWebGames Store">

<!-- 如果有分类信息，添加分类标签 -->
{#if category}
    <meta property="article:section" content={category}>
{/if}

<!-- 如果有发布时间，添加发布时间标签 -->
{#if publishedTime}
    <meta property="article:published_time" content={publishedTime}>
{/if}

<!-- 如果有修改时间，添加修改时间标签 -->
{#if modifiedTime}
    <meta property="article:modified_time" content={modifiedTime}>
{/if}

<!-- Twitter 卡片标签 -->
<meta name="twitter:card" content={twitterCard}>
<meta name="twitter:title" content={title}>
<meta name="twitter:description" content={description}>
<meta name="twitter:image" content={ogImage}>

<!-- 结构化数据 -->
<script type="application/ld+json">
    {JSON.stringify(finalStructuredData)}
</script>
