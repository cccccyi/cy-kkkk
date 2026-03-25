import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('GraphQL API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // 测试获取代币列表
  it('should fetch tokens', () => {
    const query = `
      query GetTokens($first: Int!, $skip: Int!) {
        subgraphTokens(first: $first, skip: $skip) {
          id
          name
          symbol
          decimals
        }
      }
    `;

    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query,
        variables: { first: 10, skip: 0 },
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.subgraphTokens).toBeDefined();
        expect(Array.isArray(res.body.data.subgraphTokens)).toBe(true);
        expect(res.body.data.subgraphTokens.length).toBeLessThanOrEqual(10);
        res.body.data.subgraphTokens.forEach((token) => {
          expect(token).toHaveProperty('id');
          expect(token).toHaveProperty('name');
          expect(token).toHaveProperty('symbol');
          expect(token).toHaveProperty('decimals');
        });
      });
  });

  // 测试获取池列表
  it('should fetch pools', () => {
    const query = `
      query GetPools($first: Int!, $skip: Int!) {
        subgraphPools(first: $first, skip: $skip) {
          id
          feeTier
          liquidity
          token0 {
            id
            symbol
          }
          token1 {
            id
            symbol
          }
        }
      }
    `;

    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query,
        variables: { first: 10, skip: 0 },
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.subgraphPools).toBeDefined();
        expect(Array.isArray(res.body.data.subgraphPools)).toBe(true);
        expect(res.body.data.subgraphPools.length).toBeLessThanOrEqual(10);
        res.body.data.subgraphPools.forEach((pool) => {
          expect(pool).toHaveProperty('id');
          expect(pool).toHaveProperty('feeTier');
          expect(pool).toHaveProperty('liquidity');
          expect(pool).toHaveProperty('token0');
          expect(pool).toHaveProperty('token1');
        });
      });
  });

  // 测试获取单个代币
  it('should fetch a token by address', () => {
    // 注意：这里使用的地址应该是测试环境中存在的地址
    const testAddress = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'; // 示例地址
    const query = `
      query GetToken($address: String!) {
        subgraphToken(address: $address) {
          id
          name
          symbol
          decimals
        }
      }
    `;

    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query,
        variables: { address: testAddress },
      })
      .expect(200)
      .then((res) => {
        // 处理可能的错误，例如找不到代币
        if (res.body.errors) {
          console.log('GraphQL errors:', res.body.errors);
          // 对于测试环境，我们可以允许地址不存在的情况
          expect(res.body.errors[0].message).toContain('not found');
        } else {
          expect(res.body.data.subgraphToken).toBeDefined();
          expect(res.body.data.subgraphToken.id).toBe(testAddress);
          expect(res.body.data.subgraphToken).toHaveProperty('name');
          expect(res.body.data.subgraphToken).toHaveProperty('symbol');
          expect(res.body.data.subgraphToken).toHaveProperty('decimals');
        }
      });
  });

  // 测试获取单个池
  it('should fetch a pool by address', () => {
    // 注意：这里使用的地址应该是测试环境中存在的地址
    const testAddress = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8'; // 示例地址
    const query = `
      query GetPool($address: String!) {
        subgraphPool(address: $address) {
          id
          feeTier
          liquidity
          token0 {
            id
            symbol
          }
          token1 {
            id
            symbol
          }
        }
      }
    `;

    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query,
        variables: { address: testAddress },
      })
      .expect(200)
      .then((res) => {
        // 处理可能的错误，例如找不到池
        if (res.body.errors) {
          console.log('GraphQL errors:', res.body.errors);
          // 对于测试环境，我们可以允许地址不存在的情况
          expect(res.body.errors[0].message).toContain('not found');
        } else {
          expect(res.body.data.subgraphPool).toBeDefined();
          expect(res.body.data.subgraphPool.id).toBe(testAddress);
          expect(res.body.data.subgraphPool).toHaveProperty('feeTier');
          expect(res.body.data.subgraphPool).toHaveProperty('liquidity');
          expect(res.body.data.subgraphPool).toHaveProperty('token0');
          expect(res.body.data.subgraphPool).toHaveProperty('token1');
        }
      });
  });
});