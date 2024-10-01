# Sử dụng Node.js làm base image
FROM node:16

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép package.json và package-lock.json vào container
COPY package*.json ./

# Cài đặt các phụ thuộc
RUN npm install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Xây dựng ứng dụng
RUN npm run build

# Cài đặt server để phục vụ ứng dụng
RUN npm install -g serve

# Chạy server để phục vụ ứng dụng
CMD ["serve", "-s", "build"]

# Mở cổng 3000
EXPOSE 3000
