import http from 'k6/http';
import { sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Define custom metrics
const successRate = new Rate('successful_requests_below_20ms');
const requestDuration = new Trend('http_request_duration'); // Custom trend for tracking request durations

export const options = {
  vus: 200,
  duration: '10s',
  thresholds: {
    successful_requests_below_20ms: ['rate>0.90'], // 90% of requests should be below 20ms
    http_request_duration: ['p(90)<20'],           // 90% of request durations should be below 20ms
  },
};

export default function () {
  const res = http.get(`http://${__ENV.SERVICE}`);
  
  // Track whether the response time is below 20ms
  successRate.add(res.timings.duration < 20);
  
  // Track the request duration
  requestDuration.add(res.timings.duration);
  
  sleep(1);
}



