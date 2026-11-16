import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { createStyleCache } from './Providers';

describe('Base Panorama', () => {
  it('links to the existing enterprise flow without inventing roles or business results', () => {
    render(<App cache={createStyleCache('fixture-nonce')} />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar al espacio empresarial' })).toHaveAttribute('href', '/empresas');
    expect(screen.queryByText('Andina Servicios S.A.S.')).not.toBeInTheDocument();
  });

  it('opens and closes the mobile navigation and changes appearance using labeled controls', async () => {
    const user = userEvent.setup();
    render(<App cache={createStyleCache('fixture-nonce')} />);
    const menu = screen.getByText('Menú', { selector: 'button' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    await user.click(screen.getByRole('button', { name: 'Usar tema oscuro' }));
    expect(screen.getByRole('button', { name: 'Usar tema claro' })).toBeInTheDocument();
  });

  it('provides the nonce on generated Emotion styles without relying on inline style attributes', () => {
    const { container } = render(<App cache={createStyleCache('fixture-nonce')} />);
    const styles = document.querySelectorAll<HTMLStyleElement>('style[data-emotion^="mspi"]');
    expect(styles.length).toBeGreaterThan(0);
    expect(Array.from(styles).every(style => style.nonce === 'fixture-nonce')).toBe(true);
    expect(container.querySelector('[style]')).toBeNull();
  });
});
