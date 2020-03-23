# **News** 

## Specifications
- Python version: `3.5+`

## Scripts
### API keys
#### News Fetcher
A StockNewsAPI key is required to run `news_fetcher.py`.
Create a file name `keys.py` under `news/scripts` with the following contents:
```python
API_KEY='<your StockNewsAPI key>'
```

## Sample Scripts Commands
Ran from `news/script` directory.

```sh
# news fetcher
python news_fetcher.py --help
python news_fetcher.py 01-29-2020 02-02-2020
```

