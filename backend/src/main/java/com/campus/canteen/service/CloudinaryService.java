package com.campus.canteen.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Uploads menu images to Cloudinary for durable, CDN-backed storage that
 * survives Render (or any cloud provider) container restarts and redeploys.
 *
 * Configuration (set as environment variables on Render):
 *   CLOUDINARY_CLOUD_NAME  – your Cloudinary cloud name
 *   CLOUDINARY_API_KEY     – your Cloudinary API key
 *   CLOUDINARY_API_SECRET  – your Cloudinary API secret
 *
 * When any credential is absent (local dev), uploadFile() returns null and
 * the caller falls back to local-disk storage.
 */
@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;
    private final boolean configured;

    public CloudinaryService(
            @Value("${cloudinary.cloud.name:}") String cloudName,
            @Value("${cloudinary.api.key:}") String apiKey,
            @Value("${cloudinary.api.secret:}") String apiSecret) {

        this.configured = !cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank();
        if (this.configured) {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true
            ));
        } else {
            this.cloudinary = null;
        }
    }

    /**
     * Returns {@code true} when Cloudinary credentials are present.
     * When {@code false}, callers should fall back to local-disk storage.
     */
    public boolean isConfigured() {
        return configured;
    }

    /**
     * Uploads a multipart file to the {@code bunkbites/menu} Cloudinary folder.
     *
     * @param file the image to upload
     * @return the persistent HTTPS URL of the uploaded image, or {@code null}
     *         if Cloudinary is not configured
     * @throws IOException on upload failure
     */
    @SuppressWarnings("unchecked")
    public String uploadFile(MultipartFile file) throws IOException {
        if (!configured) {
            return null;
        }
        Map<String, Object> params = ObjectUtils.asMap(
                "folder", "bunkbites/menu",
                "resource_type", "image"
        );
        Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), params);
        return (String) result.get("secure_url");
    }
}
