-- CreateTable
CREATE TABLE "UploadInfo" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "UploadInfo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UploadInfo" ADD CONSTRAINT "UploadInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
