/*
 * @Description:
 * @Author: Evllis
 * @Date: 2019-10-10 09:55:39
 * @LastEditors: Evllis
 * @LastEditTime: 2019-10-10 14:42:38
 */
//依赖模块
const fs = require('fs');
const request = require("request");
const mkdirp = require('mkdirp');
const path = require('path');
const cheerio = require("cheerio");
const rp = require("request-promise")
const chalk = require('chalk');
const log = console.log;

//本地存储目录
let dir = path.join(__dirname + '/images');
const basicPath = "https://www.uisdc.com/archives/page/";
let list = [],
    num = 0,
    start = 451,
    end = 601;

// 创建目录
mkdirp(dir, function (err) {
    if (err) {
        console.log(err);
    }
});

// 获取页面数据
async function getPage (url) {
    const data = {
        url,
        res: await rp({
            url: url
        })
    };
    return data;
}

// 获取要下载的url集
function getUrl (data) {
    list.length = 0;
    //将html转换为可操作的节点
    const $ = cheerio.load(data.res);
    $('.list-thumb img')
        .each(function (index, ele) {
            let url = $(this).attr('src');
            url = url.indexOf('http') === -1 ? 'https:' + url : url;
            list.push(url); //输出目录页查询出来的所有链接地址
        });
    return list;
}

// 反防盗链
let headers = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    Host: 'image.uisdc.com',
    Pragma: 'no-cache',
    'Proxy-Connection': 'keep-alive',
    Referer: basicPath + start,
    'Upgrade-Insecure-Requests': 1,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.19 Safari/537.36'
};

// 主要方法，用于下载文件
var download = function (url, dir, filename) {
    request.head(encodeURI(url), function (err, res, body) {
        let writeStream = fs.createWriteStream(dir + "/" + filename);
        let readStream = rp({
            url: encodeURI(url),
            resolveWithFullResponse: true,
            headers
        });
        readStream.pipe(writeStream);
        readStream.on('end', function () {
            num++;
            log(chalk.yellow(`【${filename} 】100%`));
            if (num === list.length) {
                num = 0;
                log(chalk.green(`================= 第${start}页下载完成 =======================`));
                start++;
                setTimeout(function () {
                    main(basicPath + start);
                }, Math.random() * 3000 + 1000);
            }
        });
        readStream.on('error', function () {
            num++;
            log(chalk.red(`错误信息：【${filename} 】下载错误, url地址是：${url}`));
        })
    });
};

// 主程序
const main = async url => {
    if (start > end) {
        log(chalk.green(`================= 全部下载完成 =======================`));
        return;
    }
    let list = [],
        str = '',
        strs = [];
    const data = await getPage(url);
    list = getUrl(data);
    log(chalk.blue(`================= 准备开始下载第${start}页 =======================`));
    list.map(val => {
        strs = val.split('/');
        str = strs[strs.length - 1];
        download(val, dir, str);
    })
};

main(basicPath + start);
