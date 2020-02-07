/**
 * https://www.tensorflow.org/tutorials/keras/basic_regression
 */

import * as tf from "@tensorflow/tfjs";
import {
  ServerTable,
  ClientTable,
  Event
} from 'vue-tables-2';

import {
  plotData,
  lineChart,
  stackedBarChart
} from "./ui";

// import Vue from 'vue';
// import VueWorker from 'vue-worker';
import VueCarousel from 'vue-carousel';
Vue.use(VueCarousel);
Vue.use(ClientTable);

// Vue.use(VueWorker);

window.app = {}; //make it global... sorry mom

document.addEventListener("DOMContentLoaded", function () {

  Vue.component('slides', {
    props: ['feature'],
    template: '<slide>' +
      '<h4 style="margin-left:35px">{{ feature.full }}</h4>' +
      '<div v-bind:class="feature.abrev"></div>' +
      '<label style="width:200px; margin-left:35px" class="caption">{{feature.desc}}</label>' +
      '</slide>'
  })

  // vue-table component
  Vue.component('vue-table', {
    filterable: false,
    props: ['dataset', 'columns'],
  })


  app = new Vue({
    el: '#app',
    data: {
      features: [{
        abrev: 'crim',
        full: 'Crime',
        desc: 'Per Capita Crime Rate'
      }, {
        abrev: 'zn',
        full: 'Residential Zones',
        desc: 'Proportion of residential land zoned for lots over 25,000 square feet'
      }, {
        abrev: 'indus',
        full: 'Industry',
        desc: 'Proportion of non-retail business acres per town'
      }, {
        abrev: 'chas',
        full: 'Charles River',
        desc: 'Charles River dummy variable (= 1 if tract bounds river; 0 otherwise)'
      }, {
        abrev: 'nox',
        full: 'Nitric Oxide Concentration',
        desc: 'Nitric oxides concentration (parts per 10 million)'
      }, {
        abrev: 'rm',
        full: 'Number of Rooms',
        desc: 'Average number of rooms per dwelling'
      }, {
        abrev: 'age',
        full: 'Age of Homes',
        desc: 'Proportion of owner-occupied units built prior to 1940'
      }, {
        abrev: 'dis',
        full: 'Distance to Employers',
        desc: 'Weighted distances to five Boston employment centres'
      }, {
        abrev: 'rad',
        full: 'Railway Accessibility',
        desc: 'Index of accessibility to radial highways'
      }, {
        abrev: 'tax',
        full: 'Property Tax Values',
        desc: 'Full-value property-tax rate per $10,000'
      }, {
        abrev: 'ptratio',
        full: 'Teachers per Child',
        desc: 'Pupil-teacher ratio by town'
      }, {
        abrev: 'b',
        full: 'Proportion of Blacks',
        desc: '1000 * (Bk - 0.63) ** 2 where Bk is the proportion of Black people by town'
      }, {
        abrev: 'lstat',
        full: 'People with Low Income',
        desc: 'Percentage lower status of the populatione'
      }],
      target: ['price'],
      bostonData: [],
      xs: {},
      ys: {},
      maes: [],
      trainingData: {
        raw: [],
        normalized: []
      },
      testingData: {
        raw: [],
        normalized: []
      },
      myWorker: null
    },
    // created: function () {
    //   this.$worker.run((arg) => {
    //     return `Hello, ${arg}!`
    //   }, ['World'])
    //   .then(result => {
    //     console.log(result)
    //   })
    //   .catch(e => {
    //     console.error(e)
    //   })
    // },
    mounted: function () {

      this.bostonData = require("./boston_data")
      let featureAbrevs = [];

      featureAbrevs = this.features.map(obj => {
        return obj.abrev
      })

      featureAbrevs.forEach(feature => {

        let chartXs = [];
        let chartYs = [];

        this.bostonData.forEach(record => {
          chartXs.push([record[feature]])
          chartYs.push([record[this.target]])
        })

        // Plot the data
        plotData("." + feature, tf.tensor2d(chartXs), tf.tensor2d(chartYs));

      })

      this.splitTrainTest()
      this.normalizeData()

    },
    methods: {
      splitTrainTest: function () {
        const splitSize = .8 * this.bostonData.length
        const shuffled = _.chunk(_.shuffle(this.bostonData), splitSize)
        this.trainingData.raw = shuffled[0]
        this.testingData.raw = shuffled[1]

        stackedBarChart("#splitTrainBar", this.trainingData.raw, this.testingData.raw)
      },
      normalizeData: function () {

        // Empty the data in case it was already compiled
        this.trainingData.normalized = [];
        this.testingData.normalized = [];

        // Define the raw data sets we'll be normalize
        const trainingSets = [this.trainingData.raw];
        let dataSet = "trainingData";

        trainingSets.forEach(data => {

          if (data.length === 0) {

            alert("Make sure to perform the split, train, test step first")

          } else {

            const calcs = {};
            this.features.forEach(feature => {

              // Work out the mean
              const mean = _.meanBy(data, function (record) {
                return record[feature.abrev];
              });

              // Then for each number in data set, subtract the mean and square the result
              const totalError = data.reduce((accumulator, currentValue) =>
                accumulator + Math.pow((currentValue[feature.abrev] - mean), 2), 0
              );

              // Then work out the mean of those squared differences.
              // Take the square root of that and we are done
              const stdDev = Math.sqrt(totalError / data.length)

              calcs[feature.abrev] = {}
              calcs[feature.abrev]['stdDev'] = stdDev;
              calcs[feature.abrev]['mean'] = mean

            });

            // Loop through the data again, this time calculating (feature value - mean) / std)
            // for each feature (not price though, that's the outcome variable so we don't normalize it
            data.forEach(record => {

              const arr = [];

              Object.keys(record).forEach(key => {
                key === "price" ? arr[key] = record[key] : arr[key] = ((record[key] - calcs[key].mean) / calcs[key].stdDev).toFixed(2)
              })

              this[dataSet].normalized.push(arr)
            })
          }
        })

      },
      buildModel: function () {

        const xVals = [];
        const yVals = [];
        const features = this.features.map(obj => {
          return obj.abrev
        })

        this.trainingData.normalized.forEach(obj => {

          const arrX = [];
          const arrY = [];

          Object.keys(obj).forEach(key => {
            key === "price" ? arrY.push(obj[key]) : arrX.push(obj[key])
          })

          xVals.push(arrX)
          yVals.push(arrY)

        })

        // set vue data as tensors
        this.xs = tf.tensor2d(xVals);
        this.ys = tf.tensor2d(yVals);

        // Build and compile model.
        const model = tf.sequential();

        // First layer that directly receives the training data
        const hidden1 = tf.layers.dense({
          units: 64, // Ask a phd about this value...
          inputShape: [13], // We have 13 features
          activation: 'relu' // Rectified Linear Unit (again, phd)
        })
        model.add(hidden1)

        // Second layer that received data from hidden1
        const hidden2 = tf.layers.dense({
          units: 64,
          activation: 'relu'
        })
        model.add(hidden2)

        // Third and final layer that received the hidden2 outputs
        const output = tf.layers.dense({
          units: 1,
        })
        model.add(output)

        // Define the optimizing function
        model.compile({
          optimizer: tf.train.rmsprop(0.001),
          loss: 'meanSquaredError',
          metrics: ['mae']
        });

        const config = {
          epochs: 30
        }

        model.summary()

        train(this.xs, this.ys).then(() => {
          let prediction = model.predict(this.xs)
          prediction.print()
          console.log('Done')
        })

        async function train(xs, ys) {

          const response = await model.fit(xs, ys, config);

          //response.history.mae.print()

          // update the vue data to contain array of error scores
          // can't use this because of async function scope
          app.maes = response.history.mae

          // build line chart
          lineChart("#lineChart", Array.apply(null, {
            length: config.epochs
          }).map(Number.call, Number), app.maes);

        }
      },

    }

  })
})