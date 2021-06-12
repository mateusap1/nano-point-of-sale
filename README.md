# Nano-POS

Nano-POS is an attempt of creating a simple point of sale system for small
companies that want to accept Nano as a form of payment. This project aim is not
only to facilitate this process, but also to stimulate practical uses of the
coin.

The project is still in a development phase, so there are no user-friendly
releases yet, but if you want to test the app or help in the development,
you can follow the next steps.

## Development

* Clone this repository
* Create a "db" folder
* Setup the database
* Start the project

As follows,

```bash
git clone https://github.com/mateusap1/nano-point-of-sale.git
mkdir db # Or manually create a folder in Windows
npx ts-node src/background/setup.ts
yarn start
```

** Important: This assumes you have yarn installed

