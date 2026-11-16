import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { createStyleCache } from './Providers';
import { WorkspaceStore } from '../features/access/workspace';
import { a, anonymous, identity, service } from '../features/access/fixtures.test-support';
import { ApiError } from '../shared/api/client';
function mount(api = anonymous()) {
  return render(<App cache={createStyleCache('fixture-nonce')} store={new WorkspaceStore(api)} />);
}
afterEach(() => { window.history.replaceState(null, '', '/interfaz/'); });
describe('Acceso Panorama', () => {
  it('logs in, chooses a company and logs out without retaining company data', async () => {
    const api = anonymous();
    vi.mocked(api.session).mockRejectedValueOnce(new ApiError(401, 'NO_AUTENTICADO', 'Accede.')).mockResolvedValue(identity);
    mount(api);
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Accede a MSPI' });
    await user.type(screen.getByLabelText(/^Correo electrónico/), 'persona@example.test');
    await user.type(screen.getByLabelText(/^Contraseña/), 'clave de prueba');
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getByLabelText(/^Contraseña/)).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('heading', { name: 'Elige una empresa' });
    expect(api.login).toHaveBeenCalledWith('persona@example.test', 'clave de prueba', expect.any(AbortSignal));
    await user.click(screen.getByRole('button', { name: 'Entrar a Empresa A' }));
    await screen.findByText('Empresa activa');
    expect(screen.getByRole('link', { name: 'Activos' })).toHaveAttribute('href', '#/empresas/' + a.empresaId + '/activos');
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await screen.findByText('Sesión cerrada.');
    expect(screen.queryByText(a.nombre)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Activos' })).not.toBeInTheDocument();
  });
  it.each([['RA', false, false], ['AU', true, false], ['GS', true, true], ['AE', true, true]] as const)('adapts the entry to %s', async (role, read, write) => {
    window.history.replaceState(null, '', '#/empresas/' + a.empresaId);
    const { container } = mount(service({ company: vi.fn().mockResolvedValue({ ...a, roles: [role] }) }));
    await screen.findByText('Empresa activa');
    expect(container.querySelector('[style]')).toBeNull();
    expect(Boolean(screen.queryByRole('link', { name: 'Activos' }))).toBe(read);
    if (write) expect(screen.getByText(/Tu membresía permite gestionar/)).toBeInTheDocument();
    if (role === 'AU') expect(screen.getByText(/modo de lectura/)).toBeInTheDocument();
    if (role === 'RA') expect(screen.getByRole('heading', { name: 'Mis acciones' })).toBeInTheDocument();
    if (role === 'AE') expect(screen.getByText(/También tienes permisos de administración/)).toBeInTheDocument();
  });
  it('does not infer platform privileges from an empty company list', async () => {
    mount(service({ companies: vi.fn().mockResolvedValue({ empresas: [], pagina: 0, tamano: 10, hayMas: false }) }));
    await screen.findByText(/No tienes empresas disponibles/);
    expect(screen.queryByText('Administrar plataforma')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Activos' })).not.toBeInTheDocument();
  });
  it('revalidates on focus and removes links after membership revocation', async () => {
    window.history.replaceState(null, '', '#/empresas/' + a.empresaId);
    const api = service(); mount(api);
    await screen.findByText('Empresa activa');
    vi.mocked(api.company).mockRejectedValueOnce(new ApiError(403, 'MEMBRESIA_REVOCADA', 'Denegado.'));
    fireEvent(window, new Event('focus'));
    await screen.findByRole('heading', { name: 'No pudimos abrir esta vista' });
    expect(screen.queryByRole('link', { name: 'Activos' })).not.toBeInTheDocument();
  });
  it('expires at the server timestamp and removes private data', async () => {
    vi.useFakeTimers();
    try {
      window.history.replaceState(null, '', '#/empresas/' + a.empresaId);
      await act(async () => { mount(service({ session: vi.fn().mockResolvedValue({ ...identity, expiraEn: new Date(Date.now() + 10000).toISOString() }) })); });
      expect(screen.getByText('Empresa activa')).toBeInTheDocument();
      await act(async () => { await vi.advanceTimersByTimeAsync(10001); });
      expect(screen.getByRole('heading', { name: 'Accede a MSPI' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Activos' })).not.toBeInTheDocument();
      expect(screen.queryByText(identity.nombreVisible)).not.toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });
  it('opens mobile navigation, changes theme and keeps form styles compatible with CSP', async () => {
    const { container } = mount();
    await screen.findByRole('heading', { name: 'Accede a MSPI' });
    const user = userEvent.setup();
    const menu = screen.getByText('Menú', { selector: 'button' });
    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    await user.click(screen.getByRole('button', { name: 'Usar tema oscuro' }));
    expect(screen.getByRole('button', { name: 'Usar tema claro' })).toBeInTheDocument();
    const styles = document.querySelectorAll<HTMLStyleElement>('style[data-emotion^="mspi"]');
    expect(styles.length).toBeGreaterThan(0);
    expect(Array.from(styles).every(style => style.nonce === 'fixture-nonce')).toBe(true);
    expect(container.querySelector('[style]')).toBeNull();
    const route = window.location.hash;
    await user.click(screen.getByRole('link', { name: 'Ir al contenido' }));
    expect(window.location.hash).toBe(route);
    expect(screen.getByRole('main')).toHaveFocus();
  });
  it('announces field errors and Retry-After without retaining the password', async () => {
    const api = anonymous();
    vi.mocked(api.login).mockRejectedValue(new ApiError(429, 'LIMITE', 'Espera.', [{ field: 'correo', code: 'INVALIDO', message: 'Revisa el correo.' }], 'soporte-123', 30));
    mount(api);
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Accede a MSPI' });
    await user.type(screen.getByLabelText(/^Correo electrónico/), 'persona@example.test');
    await user.type(screen.getByLabelText(/^Contraseña/), 'clave');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText(/Referencia de soporte: soporte-123/);
    expect(screen.getByLabelText(/^Contraseña/)).toHaveValue('');
    expect(screen.getByText('Revisa el correo.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /Espera \d+ s/ })).toBeDisabled());
  });
});
