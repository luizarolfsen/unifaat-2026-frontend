import axios from 'axios'

const clientApi = axios.create({
  baseURL: 'http://localhost:8080',
})

export default clientApi
