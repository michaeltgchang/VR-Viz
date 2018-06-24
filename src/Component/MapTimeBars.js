import React, { Component } from 'react';
import * as AFRAME from 'aframe';
import * as d3 from 'd3';
import * as moment from 'moment';

import GetDomain from '../Utils/GetDomain.js';
import ReadPLY from '../Utils/ReadPLY.js';
import Axis from './Axis.js';
import AxisBox from './AxisBox.js';
import GetMapShape from '../Utils/GetMapShape';
import GetMapCoordinates from '../Utils/GetMapCoordinates';

import { csv } from 'd3-request';
import { json } from 'd3-request';
import { text } from 'd3-request';

class MapTimeBars extends Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }


  componentWillMount() {
    if (this.props.data) {
      switch (this.props.data.fileType) {
        case 'json': {
          json(this.props.data.dataFile, (error, data) => {

            if (error) {
              this.setState({
                error: true,
              });
            } else {
              this.setState({
                data: data,
              });
            }
          });
          break;
        }
        case 'csv': {
          csv(this.props.data.dataFile, (error, data) => {
            data = data.map(d => {
              for (let i = 0; i < this.props.data.fieldDesc.length; i++) {
                if (this.props.data.fieldDesc[i][1] === 'number')
                  d[this.props.data.fieldDesc[i][0]] = +d[this.props.data.fieldDesc[i][0]]
                if ((this.props.data.fieldDesc[i][1] === 'date') || (this.props.data.fieldDesc[i][1] === 'time'))
                  d[this.props.data.fieldDesc[i][0]] = moment(d[this.props.data.fieldDesc[i][0]], this.props.data.fieldDesc[i][2])['_d']
                if (this.props.data.fieldDesc[i][1] === 'jsonObject')
                  d[this.props.data.fieldDesc[i][0]] = JSON.parse(d[this.props.data.fieldDesc[i][0]])
              }
              return d
            })
            if (error) {
              this.setState({
                error: true,
              });
            } else {
              this.setState({
                data: data,
              });
            }
          });
          break;
        }
        case 'ply': {
          let data = ReadPLY(this.props.data.dataFile);
          this.setState({
            data: data,
          })
          break;
        }
        case 'text': {
          text(this.props.data.dataFile, (error, text) => {

            let data = d3.csvParseRows(text).map(function (row) {
              return row.map(function (value) {
                return +value;
              });
            });
            if (error) {
              this.setState({
                error: true,
              });
            } else {
              this.setState({
                data: data,
              });
            }
          });
          break;
        }
        default: {
          csv(this.props.data.dataFile, (error, data) => {
            data = data.map(d => {
              for (let i = 0; i < this.props.data.fieldDesc.length; i++) {
                if (this.props.data.fieldDesc[i][1] === 'number')
                  d[this.props.data.fieldDesc[i][0]] = +d[this.props.data.fieldDesc[i][0]]
                if ((this.props.data.fieldDesc[i][1] === 'date') || (this.props.data.fieldDesc[i][1] === 'time'))
                  d[this.props.data.fieldDesc[i][0]] = moment(d[this.props.data.fieldDesc[i][0]], this.props.data.fieldDesc[i][2])['_d']
                if (this.props.data.fieldDesc[i][1] === 'jsonObject')
                  d[this.props.data.fieldDesc[i][0]] = JSON.parse(d[this.props.data.fieldDesc[i][0]])
              }
              return d
            })
            if (error) {
              this.setState({
                error: true,
              });
            } else {
              this.setState({
                data: data,
              });
            }
          });
          break;
        }
      }
    } else {
      this.setState({
        data: 'NA',
      });
    }
  }

  render() {
    if (!this.state.data) {
      return <a-entity />
    }
    else {
      console.log(this.props.mark.timeLayers)
      // Getting domain for axis

      let dataset = []
      for (let i = 0; i < this.state.data.length; i++) {
        for (let j = 0; j < this.props.mark.timeLayers.position.y.domain.length; j++) {
          dataset.push(this.state.data[i][this.props.mark.timeLayers.position.y.domain[j]])
        }
      }

      let min = d3.min(dataset), max = d3.max(dataset);

      // Getting domain
      let colorDomain, radiusDomain;

      if (!this.props.mark.timeLayers.style.radius.domain)
        if (this.props.mark.timeLayers.style.radius.startFromZero)
          radiusDomain = [0, max]
        else
          radiusDomain = [min, max]
      else
        radiusDomain = this.props.mark.timeLayers.style.radius.domain


      if (this.props.mark.timeLayers.style.fill.scaleType) {
        if (!this.props.mark.timeLayers.style.fill.domain) {
          if (this.props.mark.timeLayers.style.fill.startFromZero)
            colorDomain = [0, max]
          else
            colorDomain = [min, max]
        } else
          colorDomain = this.props.mark.timeLayers.style.fill.domain
      }
      //Adding Scale

      let colorScale, radiusScale;

      radiusScale = d3.scaleLinear()
        .domain(radiusDomain)
        .range(this.props.mark.timeLayers.style.radius.value)

      if (this.props.mark.timeLayers.style.fill.scaleType) {
        let colorRange = d3.schemeCategory10;
        if (this.props.mark.timeLayers.style.fill.color)
          colorRange = this.props.mark.timeLayers.style.fill.color
        colorScale = d3.scaleLinear()
          .domain(colorDomain)
          .range(colorRange)
      }

      //Drawing Map

      let geoData = GetMapShape(this.props.mark.map.data, this.props.mark.projection, this.props.mark.mapScale, this.props.mark.mapOrigin, this.props.mark.map.shapeIdentifier, this.props.mark.map.shapeKey);

      let shapes = geoData.map((d, i) => {
        let primitive = `primitive: map; vertices: ${d.vertices}; extrude: ${this.props.mark.map.style.extrusion.value}`;
        return (<a-entity geometry={primitive} material={`color: ${this.props.mark.map.style.fill.color}; metalness: 0.2; opacity:${this.props.mark.map.style.fill.opacity}`} />)
      })

      let border;
      if (this.props.mark.map.style.stroke)
        border = geoData.map((d, i) => <a-entity meshline={`lineWidth: ${this.props.mark.map.style.stroke.width}; path:${`${d.vertices.replace(/,/g, " 0,")} 0`}; color:${this.props.mark.map.style.stroke.color}`} />);

      //Adding marks

      let marks;



      switch (this.props.mark.timeLayers.type) {
        case 'box':
          {
            marks = this.state.data.map((d, i) => {
              let markTemp = this.props.mark.timeLayers.position.y.domain.map((d1, j) => {
                let position = GetMapCoordinates(d[this.props.mark.timeLayers.position.x.field], d[this.props.mark.timeLayers.position.z.field], this.props.mark.projection, this.props.mark.mapScale, this.props.mark.mapOrigin);
                if (this.props.mark.timeLayers.style.fill.scaleType)
                  return <a-box key={i} color={`${colorScale(d[d1])}`} opacity={this.props.mark.timeLayers.style.fill.opacity} height={`${radiusScale(d[d1])}`} depth={`${this.props.mark.timeLayers.style.height}`} width={`${radiusScale(d[d1])}`} position={`${position[0]} ${0 - position[1]} ${(j + 1 / 2) * this.props.mark.timeLayers.style.height + j * this.props.mark.timeLayers.style.padding}`} />
                else
                  return <a-box key={i} color={`${this.props.mark.timeLayers.style.fill.color}`} opacity={this.props.mark.timeLayers.style.fill.opacity} height={`${radiusScale(d[d1])}`} depth={`${this.props.mark.timeLayers.style.height}`} width={`${radiusScale(d[d1])}`} position={`${position[0]} ${0 - position[1]} ${(j + 1 / 2) * this.props.mark.timeLayers.style.height + j * this.props.mark.timeLayers.style.padding}`} />
              })
              return markTemp
            });
            break;
          }
        case 'cylinder':
          {
            marks = this.state.data.map((d, i) => {
              console.log(d)
              let markTemp = this.props.mark.timeLayers.position.y.domain.map((d1, j) => {
                let position = GetMapCoordinates(d[this.props.mark.timeLayers.position.x.field], d[this.props.mark.timeLayers.position.z.field], this.props.mark.projection, this.props.mark.mapScale, this.props.mark.mapOrigin);
                if (this.props.mark.timeLayers.style.fill.scaleType)
                  return <a-cylinder key={i} opacity={this.props.mark.timeLayers.style.fill.opacity} color={`${colorScale(d[d1])}`} height={`${this.props.mark.timeLayers.style.height}`} radius={`${radiusScale(d[d1])}`} segments-radial={`${this.props.mark.timeLayers.style.segments}`} position={`${position[0]} ${0 - position[1]} ${(j + 1 / 2) * this.props.mark.timeLayers.style.height + j * this.props.mark.timeLayers.style.padding}`} rotation={'90 0 0'} />
                else
                  return <a-cylinder key={i} opacity={this.props.mark.timeLayers.style.fill.opacity} color={`${this.props.mark.timeLayers.style.fill.color}`} height={`${this.props.mark.timeLayers.style.height}`} radius={`${radiusScale(d[d1])}`} segments-radial={`${this.props.mark.timeLayers.style.segments}`} position={`${position[0]} ${0 - position[1]} ${(j + 1 / 2) * this.props.mark.timeLayers.style.height + j * this.props.mark.timeLayers.style.padding}`} rotation={'90 0 0'} />
              })
              return markTemp
            });
            break;
          }
        default:
          {
            marks = this.state.data.map((d, i) => {
              let markTemp = this.props.mark.timeLayers.position.y.domain.map((d1, j) => {
                let position = GetMapCoordinates(d[this.props.mark.timeLayers.position.x.field], d[this.props.mark.timeLayers.position.z.field], this.props.mark.projection, this.props.mark.mapScale, this.props.mark.mapOrigin);
                if (this.props.mark.timeLayers.style.fill.scaleType)
                  return <a-box key={i} color={`${colorScale(d[d1])}`} opacity={this.props.mark.timeLayers.style.fill.opacity} height={`${radiusScale(d[d1])}`} depth={`${this.props.mark.timeLayers.style.height}`} width={`${radiusScale(d[d1])}`} position={`${position[0]} ${0 - position[1]} ${(j + 1 / 2) * this.props.mark.timeLayers.style.height + j * this.props.mark.timeLayers.style.padding}`} />
                else
                  return <a-box key={i} color={`${this.props.mark.timeLayers.style.fill.color}`} opacity={this.props.mark.timeLayers.style.fill.opacity} height={`${radiusScale(d[d1])}`} depth={`${this.props.mark.timeLayers.style.height}`} width={`${radiusScale(d[d1])}`} position={`${position[0]} ${0 - position[1]} ${(j + 1 / 2) * this.props.mark.timeLayers.style.height + j * this.props.mark.timeLayers.style.padding}`} />
              })
              return markTemp
            });
            break;
          }
      }

      return (
        <a-entity position={`${this.props.style.origin[0]} ${this.props.style.origin[1]} ${this.props.style.origin[2]}`} rotation={this.props.mark.rotation}>
          {shapes}
          {border}
          {marks}
        </a-entity>
      )
    }
  }
}
export default MapTimeBars