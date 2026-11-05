---
layout: academic
title: Sitemap
permalink: /sitemap/
description: "Explore the research, publications, people and writing of Guozhang Chen at Peking University."
---
<header class="page-intro"><p class="eyebrow">Find your way</p><h1>Sitemap</h1><p>A guide to the research and resources on this website.</p></header>
<div class="prose">
  <h2>Main sections</h2>
  <ul class="reading-list">
    <li><a href="{{ '/' | relative_url }}">Home</a></li>
    <li><a href="{{ '/research/' | relative_url }}">Research</a></li>
    <li><a href="{{ '/publications/' | relative_url }}">Publications</a></li>
    <li><a href="{{ '/highlights/' | relative_url }}">Research highlights</a></li>
    <li><a href="{{ '/btorch/' | relative_url }}">btorch</a></li>
    <li><a href="{{ '/people/' | relative_url }}">Our Group</a></li>
    <li><a href="{{ '/year-archive/' | relative_url }}">Writing</a></li>
    <li><a href="{{ '/job/' | relative_url }}">Join us</a></li>
  </ul>
  <h2>Research stories</h2>
  <ul class="reading-list">{% for paper in site.data.papers %}<li><a href="{{ paper.url | relative_url }}">{{ paper.title }}</a><span>{{ paper.venue }} · {{ paper.year }}</span></li>{% endfor %}</ul>
  <h2>Writing</h2>
  <ul class="reading-list">{% for post in site.posts %}<li><a href="{{ post.url | relative_url }}">{{ post.title }}</a><span>{{ post.date | date: '%B %d, %Y' }}</span></li>{% endfor %}</ul>
  <p><a href="{{ '/feed.xml' | relative_url }}">RSS feed</a> · <a href="{{ '/sitemap.xml' | relative_url }}">XML sitemap</a></p>
</div>
