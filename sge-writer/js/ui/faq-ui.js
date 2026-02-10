/**
 * SGE 文案助手 - FAQ UI Module
 * @module faq-ui
 */

import { faqData } from '../data/faq-data.js';

export const faqUI = {
  elements: {
    toggle: null,
    content: null,
    searchInput: null,
    list: null
  },

  init() {
    this.elements.toggle = document.getElementById('faq-toggle');
    this.elements.content = document.getElementById('faq-content');
    this.elements.searchInput = document.getElementById('faq-search-input');
    this.elements.list = document.getElementById('faq-list');

    if (!this.elements.toggle || !this.elements.content) {
      console.warn('FAQ elements not found');
      return;
    }

    this.render();
    this.bindEvents();
  },

  render() {
    const categories = Object.keys(faqData);
    let html = '';

    categories.forEach(categoryKey => {
      const category = faqData[categoryKey];

      html += `
        <div class="faq-category" data-category="${categoryKey}">
          <div class="faq-category-title">${category.title}</div>
          ${category.questions.map((item, index) => `
            <div class="faq-item" data-category="${categoryKey}" data-index="${index}">
              <button class="faq-question" type="button">
                ${item.q}
                <svg class="faq-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
              <div class="faq-answer">
                <p>${item.a}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    });

    this.elements.list.innerHTML = html;
  },

  bindEvents() {
    // Toggle FAQ panel
    this.elements.toggle.addEventListener('click', () => {
      this.togglePanel();
    });

    // Toggle individual FAQ items
    this.elements.list.addEventListener('click', (e) => {
      const questionBtn = e.target.closest('.faq-question');
      if (questionBtn) {
        const faqItem = questionBtn.closest('.faq-item');
        this.toggleItem(faqItem);
      }
    });

    // Search functionality
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }
  },

  togglePanel() {
    const isExpanded = this.elements.content.classList.contains('expanded');

    if (isExpanded) {
      this.elements.content.classList.remove('expanded');
      this.elements.toggle.classList.remove('expanded');
    } else {
      this.elements.content.classList.add('expanded');
      this.elements.toggle.classList.add('expanded');
    }
  },

  toggleItem(faqItem) {
    const isExpanded = faqItem.classList.contains('expanded');

    // Close all other items in the same category
    const category = faqItem.dataset.category;
    const categoryItems = this.elements.list.querySelectorAll(`[data-category="${category}"] .faq-item`);
    categoryItems.forEach(item => {
      if (item !== faqItem) {
        item.classList.remove('expanded');
      }
    });

    // Toggle current item
    if (isExpanded) {
      faqItem.classList.remove('expanded');
    } else {
      faqItem.classList.add('expanded');
    }
  },

  handleSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    const allItems = this.elements.list.querySelectorAll('.faq-item');
    const allCategories = this.elements.list.querySelectorAll('.faq-category');
    let hasResults = false;

    if (searchTerm === '') {
      // Show all items
      allItems.forEach(item => item.classList.remove('hidden'));
      allCategories.forEach(cat => cat.style.display = 'block');
      this.removeNoResults();
      return;
    }

    // Filter items
    allCategories.forEach(category => {
      const categoryItems = category.querySelectorAll('.faq-item');
      let categoryHasResults = false;

      categoryItems.forEach(item => {
        const question = item.querySelector('.faq-question').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer').textContent.toLowerCase();

        if (question.includes(searchTerm) || answer.includes(searchTerm)) {
          item.classList.remove('hidden');
          categoryHasResults = true;
          hasResults = true;
        } else {
          item.classList.add('hidden');
        }
      });

      // Hide category if no results
      category.style.display = categoryHasResults ? 'block' : 'none';
    });

    // Show "no results" message
    if (!hasResults) {
      this.showNoResults();
    } else {
      this.removeNoResults();
    }
  },

  showNoResults() {
    if (document.querySelector('.faq-no-results')) return;

    const noResultsHTML = `
      <div class="faq-no-results">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <p>找不到相關問題</p>
      </div>
    `;

    this.elements.list.insertAdjacentHTML('beforeend', noResultsHTML);
  },

  removeNoResults() {
    const noResults = document.querySelector('.faq-no-results');
    if (noResults) {
      noResults.remove();
    }
  }
};
