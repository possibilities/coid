# coid

curl or it didn't happen

## summary

an experiment where i stick curl in unexpected places

#### experiment 1

use `curl` to make requests when running puppeteer tests for the purpose of creating API "reproductions" from frontend test suites

##### features

- [x] output
  - [x] dump `curl` output to screen as requests are processed
  - [ ] optionally capture output and request metadata for rendering elsewhere
  - [ ] control output type via env var
- [ ] use `jq` to improve output when present
