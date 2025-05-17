# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains a simple personal website for Daniel Long, showcasing his background, projects, reading list, and a photo gallery. The site is built with plain HTML, CSS, and JavaScript without any frameworks or build process.

## Site Structure

- `index.html` - Main page with personal information, education, and work experience
- `projects.html` - Portfolio of programming and professional projects
- `gallery.html` - Photo gallery organized by location/event with masonry grid layout
- `reading.html` - Reading list or recommendations
- `main.css` - Primary stylesheet for the entire site
- `images/` - Contains various images and icons used throughout the site
- `projects/` - Contains project-specific resources (images, code)
- `academic_experience/` - PDF files of academic papers and projects

## Interactive Components

- **Othello Game**: An interactive JavaScript implementation of the Othello/Reversi board game located in `projects/othello/main.js`. It includes several AI opponents of increasing complexity (random, greedy, minimax).
- **Responsive Menu**: The site includes a responsive hamburger menu for mobile devices.
- **Masonry Grid**: The gallery uses a CSS-based masonry grid layout for displaying photos.

## Deployment

The site is deployed at [daniellong.co](https://daniellong.co). There's no specific build or deployment process mentioned, suggesting a simple static file hosting setup.

## Common Tasks

### Adding New Gallery Images

1. Add new images to the appropriate subfolder in `images/gallery/` 
2. Update the corresponding section in `gallery.html` by adding new `<div class="masonry-item">` elements with the image paths

### Adding New Projects

1. Create a new `<section>` in `projects.html` with appropriate HTML structure
2. Add any project resources (images, code) to the `projects/` directory
3. If the project has interactive elements, add the JavaScript in the appropriate location

### Site-Wide Changes

- Navigation menu items are defined in each HTML file and must be updated individually
- The footer with social media links is also defined in each HTML file
- Styling is centralized in `main.css`

## Code Style Conventions

- HTML uses 2-space indentation
- CSS uses nested selectors and media queries for responsive design
- JavaScript follows standard ES6 conventions
- All file paths in HTML are relative 
- Custom variables are defined in the CSS `:root` selector for colors and spacing

## Maintenance Notes

- The site does not use any package manager or build tools
- Google Analytics is included in some HTML files
- Some meta descriptions need updating to reflect current status
- No particular testing methodology is in place