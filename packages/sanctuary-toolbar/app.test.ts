import { describe, it, expect, vi } from 'vitest';
import { defineToolbarApp } from 'astro/toolbar';
import { render } from 'preact';
import { html } from 'htm/preact';
import * as app from './app';

describe('app.ts', () => {
  describe('resetPosition', () => {
    it('should reset the position of content, highlights, and buttons', () => {
      document.body.innerHTML = `
        <div data-sanctuary="{}" data-index="0"></div>
        <div class="sanctuary-highlight" data-index="0"></div>
        <div class="sanctuary-button" data-index="0"></div>
      `;

      const content = document.querySelectorAll<HTMLElement>('[data-sanctuary]');
      const highlights = document.querySelectorAll<HTMLElement>('.sanctuary-highlight');
      const buttons = document.querySelectorAll<HTMLElement>('.sanctuary-button');

      content[0].getBoundingClientRect = vi.fn(() => ({
        width: 100,
        height: 100,
        top: 50,
        left: 50,
        bottom: 150,
        right: 150,
        x: 50,
        y: 50,
        toJSON: () => {},
      }));

      app.resetPosition();

      expect(highlights[0].style.width).toBe('100px');
      expect(highlights[0].style.height).toBe('100px');
      expect(highlights[0].style.top).toBe('50px');
      expect(highlights[0].style.left).toBe('50px');
      expect(buttons[0].style.top).toBe('50px');
      expect(buttons[0].style.left).toBe('50px');
    });
  });

  describe('postMessage', () => {
    it('should send a message to the parent window', () => {
      const e = {
        preventDefault: vi.fn(),
        target: {
          getAttribute: vi.fn(() => 'http://example.com'),
        },
      };

      global.window = Object.create(window);
      Object.defineProperty(window, 'parent', {
        value: {
          postMessage: vi.fn(),
        },
      });
      Object.defineProperty(window, 'self', {
        value: {},
      });

      app.postMessage(e);

      expect(e.preventDefault).toHaveBeenCalled();
      expect(window.parent.postMessage).toHaveBeenCalledWith(
        {
          type: 'SANCTUARY_POST_MESSAGE',
          href: 'http://example.com',
        },
        '*'
      );
    });
  });

  describe('openEdit', () => {
    it('should open the edit form in a new tab', () => {
      const e = {
        target: {
          getAttribute: vi.fn(() => 'http://example.com'),
        },
      };

      global.window = Object.create(window);
      Object.defineProperty(window, 'open', {
        value: vi.fn(),
      });

      app.openEdit(e);

      expect(window.open).toHaveBeenCalledWith('http://example.com', '_blank');
    });
  });

  describe('toggleHighlight', () => {
    it('should toggle the display of the related highlight', () => {
      document.body.innerHTML = `
        <div class="sanctuary-highlight" data-index="0" style="display: none;"></div>
      `;

      const e = {
        target: {
          dataset: {
            index: '0',
          },
        },
      };

      app.toggleHighlight(e);

      const relatedHighlight = document.querySelector('.sanctuary-highlight[data-index="0"]');
      expect(relatedHighlight.style.display).toBe('block');

      app.toggleHighlight(e);
      expect(relatedHighlight.style.display).toBe('none');
    });
  });

  describe('DrupalElement', () => {
    it('should render a button and highlight for the element', () => {
      const element = document.createElement('div');
      element.setAttribute('data-sanctuary', '{}');
      const index = 0;

      const result = app.DrupalElement({ element, index });

      expect(result).toBeTruthy();
    });
  });

  describe('App', () => {
    it('should render an array of DrupalElement components', () => {
      const content = document.querySelectorAll<HTMLElement>('[data-sanctuary]');

      const result = app.App({ content });

      expect(result).toBeTruthy();
    });
  });

  describe('renderApp', () => {
    it('should render the toolbar app', () => {
      document.body.innerHTML = `
        <div data-sanctuary="{}"></div>
      `;

      app.renderApp();

      const buttons = document.querySelectorAll('.sanctuary-button');
      expect(buttons.length).toBe(1);
    });
  });

  describe('handleRoutingEvent', () => {
    it('should re-render the app after client-side navigation', () => {
      const unobserveSpy = vi.spyOn(app.resizeObserver, 'unobserve');
      const observeSpy = vi.spyOn(app.resizeObserver, 'observe');
      const renderAppSpy = vi.spyOn(app, 'renderApp');
      const resetPositionSpy = vi.spyOn(app, 'resetPosition');

      app.handleRoutingEvent();

      expect(unobserveSpy).toHaveBeenCalledWith(document.body);
      expect(renderAppSpy).toHaveBeenCalled();
      expect(observeSpy).toHaveBeenCalledWith(document.body);
      expect(resetPositionSpy).toHaveBeenCalled();
    });
  });

  describe('defineToolbarApp', () => {
    it('should set up and tear down toolbar app elements when the toolbar is toggled', () => {
      const onToggledSpy = vi.fn();
      const appInstance = {
        onToggled: onToggledSpy,
      };

      app.default.init(null, appInstance);

      expect(onToggledSpy).toHaveBeenCalled();
    });
  });
});
