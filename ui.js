/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import renderChart from "vega-embed";


export async function plotData(container, xs, ys) {
  const xvals = await xs.data();
  const yvals = await ys.data();

  const values = Array.from(yvals).map((y, i) => {
    return {
      x: xvals[i],
      y: yvals[i]
    };
  });

  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v2.json",
    width: 250,
    height: 250,
    data: {
      values: values
    },
    mark: "point",
    encoding: {
      x: {
        field: "x",
        type: "quantitative",
        title: null
      },
      y: {
        field: "y",
        type: "quantitative",
        title: "Price"
      }
    }
  };

  return renderChart(container, spec, {
    actions: false
  });
}


export async function lineChart(container, xs, ys) {
  const xvals = await xs;
  const yvals = await ys;

  const values = Array.from(yvals).map((y, i) => {
    return {
      x: xvals[i],
      y: yvals[i]
    };
  });

  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v2.json",
    width: 1100,
    height: 250,
    data: {
      values: values
    },

    layer: [{
        encoding: {
          x: {
            field: "x",
            type: "quantitative",
            title: "Epochs"
          },
          y: {
            field: "y",
            type: "quantitative",
            title: "Mean Abs. Error [$1000's]"
          }
        },
        layer: [{
          mark: "line"
        }, {
          selection: {
            tooltip: {
              type: "single",
              nearest: true,
              on: "mouseover",
              encodings: [
                "x"
              ],
              empty: "none"
            }
          },
          mark: "point",
          encoding: {
            opacity: {
              condition: {
                selection: "tooltip",
                value: 1
              },
              value: 0
            }
          }
        }]
      },
      {
        transform: [{
          filter: {
            selection: "tooltip"
          }
        }],
        layer: [{
          mark: {
            type: "rule",
            color: "gray"
          },
          encoding: {
            x: {
              type: "quantitative",
              field: "x"
            }
          }
        }, {
          mark: {
            type: "text",
            align: "left",
            dx: 5,
            dy: -5
          },
          encoding: {
            text: {
              type: "quantitative",
              field: "y"
            },
            x: {
              type: "quantitative",
              field: "x"
            },
            y: {
              type: "quantitative",
              field: "y"
            }
          }
        }]
      }
    ]
  }



return renderChart(container, spec, {
    actions: false
  });
}


export async function stackedBarChart(container, training, testing) {

  const values = [];

  training.forEach(record => {
    values.push({type : "Training"})
  })

  testing.forEach(record => {
    values.push({type : "Testing"})
  })

  const spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v2.json",
    data: {
      values: values
    },
  "mark": "bar",
  "encoding": {
    "x": {
      "aggregate": "count",
      "type": "quantitative"
    },
    "color": {
      "field": "type",
      "type": "nominal",
      "scale": {
        "domain": ["Training","Testing"],
        // "range": ["#e7ba52","#c7c7c7"]
      },
      "legend": {"title": "Splits"}
    }
  }
}

  return renderChart(container, spec, { 
    actions: false
  });

}
