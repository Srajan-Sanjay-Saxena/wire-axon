import { describe, it, expect } from 'vitest';
import { ApiValidationService } from '../helper/validation.manager.js';
import { urlSchema, getConfigSchema, mutationConfigSchema, bodySchema } from '../schemas/api.validation.schema.js';

describe('ApiValidationService.validateInput', () => {
  it('returns branded value on valid input', () => {
    const result = ApiValidationService.validateInput('/api/users', urlSchema);
    expect(result).toBe('/api/users');
  });

  it('throws on invalid input', () => {
    expect(() => ApiValidationService.validateInput('', urlSchema)).toThrow('Invalid input');
  });

  it('throws when URL does not start with / and is not absolute', () => {
    expect(() => ApiValidationService.validateInput('api/users', urlSchema)).toThrow('Invalid input');
  });

  it('accepts absolute URLs', () => {
    const result = ApiValidationService.validateInput('https://api.example.com/users', urlSchema);
    expect(result).toBe('https://api.example.com/users');
  });
});

describe('ApiValidationService.validateRequestData — GET', () => {
  it('returns validated url and config', () => {
    const result = ApiValidationService.validateRequestData(
      'get',
      { url: urlSchema, config: getConfigSchema },
      '/api/users',
      {}
    );
    expect(result.url).toBe('/api/users');
    expect(result.config).toEqual({});
  });

  it('throws when url is invalid', () => {
    expect(() =>
      ApiValidationService.validateRequestData(
        'get',
        { url: urlSchema, config: getConfigSchema },
        'bad-url',
        {}
      )
    ).toThrow('Invalid input');
  });

  it('throws when config has unknown keys', () => {
    expect(() =>
      ApiValidationService.validateRequestData(
        'get',
        { url: urlSchema, config: getConfigSchema },
        '/api/users',
        { unknownKey: true }
      )
    ).toThrow('Invalid input');
  });

  it('accepts valid config fields', () => {
    const result = ApiValidationService.validateRequestData(
      'get',
      { url: urlSchema, config: getConfigSchema },
      '/api/users',
      { timeout: 5000, params: { page: 1 } }
    );
    expect(result.config).toEqual({ timeout: 5000, params: { page: 1 } });
  });
});

describe('ApiValidationService.validateRequestData — mutations', () => {
  it('returns validated url, config, and body for POST', () => {
    const result = ApiValidationService.validateRequestData(
      'post',
      { url: urlSchema, config: mutationConfigSchema, body: bodySchema },
      '/api/users',
      {},
      { name: 'John' }
    );
    expect(result.url).toBe('/api/users');
    expect(result.body).toEqual({ name: 'John' });
  });

  it('throws when body is empty', () => {
    expect(() =>
      ApiValidationService.validateRequestData(
        'post',
        { url: urlSchema, config: mutationConfigSchema, body: bodySchema },
        '/api/users',
        {},
        {}
      )
    ).toThrow('Invalid input');
  });

  it('works for PATCH', () => {
    const result = ApiValidationService.validateRequestData(
      'patch',
      { url: urlSchema, config: mutationConfigSchema, body: bodySchema },
      '/api/users/1',
      {},
      { name: 'Jane' }
    );
    expect(result.body).toEqual({ name: 'Jane' });
  });

  it('works for DELETE', () => {
    const result = ApiValidationService.validateRequestData(
      'delete',
      { url: urlSchema, config: mutationConfigSchema, body: bodySchema },
      '/api/users/1',
      {},
      { id: '1' }
    );
    expect(result.url).toBe('/api/users/1');
  });
});
