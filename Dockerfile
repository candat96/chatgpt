# Bước 1: Sử dụng một image Node.js chính thức
FROM node:18-alpine AS build

# Bước 2: Đặt thư mục làm việc bên trong container
WORKDIR /app

# Bước 3: Copy package.json và package-lock.json để cài đặt dependencies
COPY package.json package-lock.json ./

# Bước 4: Cài đặt dependencies
RUN npm install

# Bước 5: Copy toàn bộ mã nguồn của ứng dụng vào container
COPY . .

# Bước 6: Build ứng dụng React cho môi trường production
RUN npm run build

# Bước 7: Sử dụng Nginx để phục vụ ứng dụng React build
FROM nginx:1.21-alpine

# Bước 8: Copy các file build từ bước trước vào Nginx container
COPY --from=build /app/build /usr/share/nginx/html

# Bước 9: Copy file cấu hình Nginx
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

# Mở cổng 80 cho ứng dụng
EXPOSE 80

# Khởi chạy Nginx server
CMD ["nginx", "-g", "daemon off;"]
