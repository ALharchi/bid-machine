import requests
from bs4 import BeautifulSoup


def run():
    resp = requests.get("https://example.com/data")
    soup = BeautifulSoup(resp.text, "html.parser")
    # parse, transform, then push to your API
    #requests.post("http://backend:8000/api/scraped-data", json={"result": "..."})