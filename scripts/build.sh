#!/bin/bash
cd ..
cp book-assets/book.json text/
cd text/
gitbook pdf ./ ../out/the-graphql-guide.pdf
gitbook epub ./ ../out/the-graphql-guide.epub
gitbook mobi ./ ../out/the-graphql-guide.mobi