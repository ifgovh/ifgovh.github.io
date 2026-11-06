---
layout: academic
permalink: /
title: Home
section: home
description: "Guozhang Chen at Peking University. Exploring how neural architecture and dynamics give rise to computation, learning and intelligent behavior."
redirect_from:
  - /about/
  - /about.html
---
<section class="hero">
<div><p class="eyebrow">NeuroAI · Neuroscience · Physics</p><h1 class="hero-name">Guozhang Chen</h1><h2 class="hero-question">{{ site.data.copy.home.headline }}</h2><p class="hero-intro">{{ site.data.copy.home.intro }}</p><div class="profile-links"><span>guozhang.chen [at] pku.edu.cn</span><a href="{{ site.author.googlescholar }}">Google Scholar ↗</a><a href="https://github.com/ifgovh">GitHub ↗</a><a href="{{ site.author.orcid }}">ORCID ↗</a></div></div>
<figure class="portrait"><img class="profile-photo" src="{{ '/images/guozhang-chen.webp' | relative_url }}?v=2" width="2000" height="2999" alt="Guozhang Chen"><figcaption>Guozhang Chen · Peking University</figcaption></figure>
</section>
<section aria-labelledby="research-heading"><div class="section-heading"><div><p class="eyebrow">Research interests · NeuroAI</p><h2 id="research-heading">Architecture ↔ Dynamics ↔ Computation</h2></div><a class="text-link" href="{{ '/research/' | relative_url }}">Explore our research ↗</a></div><figure class="research-art"><img src="{{ '/assets/images/art/neuroai-embodied.webp' | relative_url }}" width="1672" height="941" alt="Conceptual illustration connecting neural circuits, dynamics and embodied intelligence."><figcaption>Conceptual illustration of our research interests</figcaption></figure><p class="section-intro">{{ site.data.copy.home.research_intro }}</p>{% if site.data.copy.home.embodied_ai %}<p class="section-intro">{{ site.data.copy.home.embodied_ai }}</p>{% endif %}</section>
<section aria-labelledby="recent-heading"><div class="section-heading"><div><p class="eyebrow">Research &amp; publications</p><h2 id="recent-heading">Recent work</h2></div><a class="text-link" href="{{ '/publications/' | relative_url }}">All publications ↗</a></div><div class="recent-list">{% for paper in site.data.papers limit:8 %}<article class="recent-paper"><span class="recent-year">{{ paper.year }}</span><div><h3><a href="{{ '/publications/' | relative_url }}#pub-{{ paper.id }}">{{ paper.title }}</a></h3><p>{{ paper.authors | join: ', ' | replace: 'Guozhang Chen', '<strong>Guozhang Chen</strong>' }} · <span>{{ paper.venue }}</span>{% if paper.kind == 'preprint' %} · Preprint{% elsif paper.kind == 'workshop' %} · Workshop{% endif %}</p></div></article>{% endfor %}</div></section>
{% include btorch-feature.html %}
<section class="callout" aria-labelledby="join-heading"><p class="eyebrow">Join the conversation</p><h2 id="join-heading">Work at the intersection.</h2><p>We welcome students with backgrounds in computer science, neuroscience, physics, mathematics and related fields.</p><a class="text-link" href="{{ '/job/' | relative_url }}">PhD &amp; internship opportunities ↗</a></section>
