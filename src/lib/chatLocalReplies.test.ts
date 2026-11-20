import { describe, expect, it } from 'vitest';
import { localReply, normalize } from './chatLocalReplies';

describe('localReply', () => {
  it('normaliza tildes y mayúsculas', () => {
    expect(normalize('¿Qué JARDÍN?')).toBe('¿que jardin?');
  });

  it('lleva una consulta de colegios al módulo 1 con acción rápida', () => {
    const reply = localReply('¿Qué colegios hay en El Tintal?');
    expect(reply.key).toBe('chat.replies.category');
    expect(reply.params).toEqual({ slug: 'centros-educativos' });
    expect(reply.action).toEqual({
      to: '/categorias/centros-educativos',
      labelKey: 'categories.centros-educativos.name',
    });
  });

  it('ofrece información local y fuente oficial en ambos idiomas', () => {
    expect(localReply('library').sources?.[0]?.url).toContain('biblored.gov.co');
    expect(localReply('transporte').sources?.[0]?.url).toContain('transmilenio.gov.co');
  });

  it('entiende inglés y comida', () => {
    expect(localReply('Show me food places').action?.to).toBe('/categorias/sitios-comida');
  });

  it('distingue la estación de la biblioteca y responde seguimientos sin conexión', () => {
    expect(localReply('estación biblioteca').key).toBe('chat.replies.transit');
    expect(localReply('¿Y el teléfono?', 'Biblioteca El Tintal').key).toBe('chat.replies.libraryPhone');
    expect(localReply('hours?', 'Biblioteca El Tintal').key).toBe('chat.replies.libraryHours');
    expect(localReply('me están atacando').key).toBe('chat.replies.urgent');
  });

  it('casa raíces al inicio de palabra, no dentro de otras', () => {
    expect(localReply('Busco una veterinaria').action?.to).toBe('/categorias/veterinarias');
    expect(localReply('¿Dónde paran los buses?').action?.to).toBe('/categorias/estaciones-transporte');
  });

  it('el módulo de robos responde en tono preventivo', () => {
    const reply = localReply('¿Hay hurtos cerca?');
    expect(reply.key).toBe('chat.replies.theft');
    expect(reply.alert).toBe(true);
  });

  it('el contacto con Marie tiene prioridad y lleva al perfil', () => {
    expect(localReply('¿Cómo le escribo a Marie por WhatsApp?').action?.to).toBe('/creadora');
  });

  it('saludo, ayuda, mapa e historia', () => {
    expect(localReply('Hola').key).toBe('chat.replies.greet');
    expect(localReply('¿Qué puedes hacer?').key).toBe('chat.replies.help');
    expect(localReply('Abre el mapa 3D').action?.to).toBe('/mapa');
    expect(localReply('Cuéntame la historia').action?.to).toBe('/historia');
  });

  it('no inventa: lo desconocido cae en la respuesta de respaldo', () => {
    expect(localReply('xyz').key).toBe('chat.replies.fallback');
    expect(localReply('chicharrón').key).toBe('chat.replies.fallback');
  });
});
