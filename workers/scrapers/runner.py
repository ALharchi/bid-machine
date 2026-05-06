import schedule
import time
from scrapers.bid_scraper import run as run_bid_scraper


schedule.every().day.at("03:00").do(run_bid_scraper)

if __name__ == "__main__":
    run_bid_scraper()  # run once on startup
    while True:
        schedule.run_pending()
        time.sleep(60)