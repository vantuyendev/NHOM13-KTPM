# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /source

# Copy solution file
COPY ["NHOM13-KTPM.sln", "./"]

# Copy project files
COPY ["src/Nhom13.ProjectStorage.Api/", "src/Nhom13.ProjectStorage.Api/"]

# Restore and build
RUN dotnet restore
RUN dotnet build -c Release --no-restore
RUN dotnet publish -c Release -o /app/publish

# Publish stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

# Expose port
EXPOSE 8080

# Set environment
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "Nhom13.ProjectStorage.Api.dll"]
