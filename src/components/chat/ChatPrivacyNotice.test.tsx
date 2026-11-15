import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../../i18n/i18n';
import { chatStatus } from '../../lib/chatApi';
import { ChatPrivacyNotice } from './ChatPrivacyNotice';

vi.mock('../../lib/chatApi', () => ({ chatStatus: vi.fn() }));
const status = vi.mocked(chatStatus);

beforeEach(() => status.mockReset());

describe('Aviso de privacidad del chat (H36)', () => {
  it('con Gemini avisa que no se escriban datos personales', async () => {
    status.mockResolvedValue({ proveedor: 'gemini' });
    render(<ChatPrivacyNotice />);
    expect(await screen.findByText(/no escribas datos personales/)).toBeInTheDocument();
  });

  it('sin proveedor externo no muestra nada', async () => {
    status.mockResolvedValue({ proveedor: null });
    const { container } = render(<ChatPrivacyNotice />);
    await vi.waitFor(() => expect(status).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
