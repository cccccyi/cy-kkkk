import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ArticleService } from '../article/article.service';
import { NewsService } from '../news/news.service';
import { TweetService } from '../tweet/tweet.service';
import { create } from 'xmlbuilder2';
import dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('RSS订阅')
@Controller('rss')
export class RssController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly newsService: NewsService,
    private readonly tweetService: TweetService,
  ) {}

  @Get('/news')
  async getNewsRss(@Res() res: Response) {
    const query = {
      pageNum: 1,
      pageSize: 100,
    };
    const news = await this.newsService.findAll(query);
    const newsList = news.data.list || [];
    const queryTweet = {
      pageNum: 1,
      pageSize: 20,
      tag: 'whale',
    };
    const tweets = await this.tweetService.findAll(queryTweet);
    const tweetsList = tweets.data.list || [];

    const list = [];
    if (Array.isArray(newsList)) {
      for (const item of newsList) {
        const description = "<div style='font-weight:bold'>" + item.title + '</div><br/><br/>' + item.detailContent;
        list.push({
          //title: item.title,
          title: '',
          link: `https://hashnews.pro/news?code=${item.uniqueCode}`,
          categories: ['HashNews'],
          guid: `https://hashnews.pro/news?code=${item.uniqueCode}`,
          pubDate: dayjs(item.publishTime * 1000)
            .utc()
            .toDate(),
          description: description,
        });
      }
    }
    if (Array.isArray(tweetsList)) {
      for (const item of tweetsList) {
        let text = item.fullText;
        if (item.mediaUrlHttps) {
          text = text + `<img src="${item.mediaUrlHttps}">`;
        }
        text = "<div style='font-weight:bold'>巨鲸操作（Whale Movements Alert）</div><br/><br/>" + text;
        list.push({
          //title: '巨鲸操作（Whale Movements Alert）',
          title: '',
          link: `https://hashnews.pro/x?tid=${item.tweetId}&t=whale`,
          categories: ['Whale'],
          guid: `https://hashnews.pro/x?tid=${item.tweetId}&t=whale`,
          pubDate: dayjs(item.createdAt * 1000)
            .utc()
            .toDate(),
          description: text,
        });
      }
    }
    list.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

    const feed = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('rss', {
        version: '2.0',
        'xmlns:atom': 'http://www.w3.org/2005/Atom',
      })
      .ele('channel')
      .ele('title')
      .txt('HashNews')
      .up()
      .ele('link')
      .txt('https://hashnews.pro/')
      .up()
      .ele('description')
      .txt('')
      .up();

    for (const item of list) {
      const entry = feed.ele('item');
      entry.ele('title').txt(item.title).up();
      entry.ele('link').txt(item.link).up();
      entry.ele('guid').txt(item.guid).up();
      entry.ele('category').txt(item.categories).up(); // 包 CDATA
      entry.ele('pubDate').txt(item.pubDate.toUTCString()).up();
      entry.ele('description').txt(item.description).up(); // 包 CDATA
    }

    const xml = feed.end({ prettyPrint: true });

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  }
  @Get('/article')
  async getArticleRss(@Res() res: Response) {
    const query = {
      pageNum: 1,
      pageSize: 100,
    };
    const articles = await this.articleService.findAll(query);
    const atticleList = articles.data.list || [];

    const list = [];
    if (Array.isArray(atticleList)) {
      for (const item of atticleList) {
        list.push({
          title: item.title,
          link: `https://hashnews.pro/deepNews?code=${item.uniqueCode}`,
          categories: ['HashNews'],
          guid: `https://hashnews.pro/deepNews?code=${item.uniqueCode}`,
          img: `https://hashnews.pro/${item.img}`,
          pubDate: dayjs(item.publishTime * 1000)
            .utc()
            .toDate(),
          description: item.content,
        });
      }
    }
    list.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

    const feed = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('rss', {
        version: '2.0',
        'xmlns:atom': 'http://www.w3.org/2005/Atom',
      })
      .ele('channel')
      .ele('title')
      .txt('HashNews')
      .up()
      .ele('link')
      .txt('https://hashnews.pro/')
      .up()
      .ele('description')
      .txt('')
      .up()
      .ele('atom:link', {
        href: 'https://hashnews.pro/rss',
        rel: 'self',
        type: 'application/rss+xml',
      })
      .up();

    for (const item of list) {
      const entry = feed.ele('item');
      entry.ele('title').txt(item.title).up();
      entry.ele('link').txt(item.link).up();
      entry.ele('guid').txt(item.guid).up();
      entry.ele('category').txt(item.categories).up(); // 包 CDATA
      entry.ele('pubDate').txt(item.pubDate.toUTCString()).up();
      entry.ele('img').txt(item.img).up();
      entry.ele('description').dat(item.description).up(); // 包 CDATA
    }

    const xml = feed.end({ prettyPrint: true });

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  }
}
