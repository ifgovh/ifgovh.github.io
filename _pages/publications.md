---
layout: academic
title: Publications
permalink: /publications/
section: publications
description: "Papers, preprints and open research resources from Guozhang Chen and colleagues, with a dedicated research story for each work."
---
<header class="page-intro"><p class="eyebrow">The research record</p><h1>Publications</h1><p>Published work, preprints and the resources behind them. Each research story introduces the scientific question and connects it to our wider research.</p><a class="text-link" href="{{ site.author.googlescholar }}">Google Scholar ↗</a></header>
<div class="filter-bar" role="group" aria-label="Filter publications by type"><button type="button" data-filter="all" aria-pressed="true">All work</button><button type="button" data-filter="journal" aria-pressed="false">Journals</button><button type="button" data-filter="conference" aria-pressed="false">Conferences</button><button type="button" data-filter="preprint" aria-pressed="false">Preprints</button><button type="button" data-filter="workshop" aria-pressed="false">Workshops</button></div><p class="results-count" data-results>{{ site.data.papers | size }} publications</p>
<div class="paper-list">{% for paper in site.data.papers %}{% include paper-entry.html paper=paper %}{% endfor %}</div>
<p class="catalog-note">This catalog contains works identified through November 5, 2026; additional publications may be listed on <a href="{{ site.author.googlescholar }}">Google Scholar</a>. Preprints are identified separately from peer-reviewed work; workshop papers are labeled explicitly.</p>
