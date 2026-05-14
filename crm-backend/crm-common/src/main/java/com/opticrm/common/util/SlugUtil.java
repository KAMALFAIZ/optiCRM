package com.opticrm.common.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class SlugUtil {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");
    private static final Pattern EDGES_DASHES = Pattern.compile("(^-|-$)");

    private SlugUtil() {
    }

    public static String toSlug(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }

        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String withoutAccents = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String lowercase = withoutAccents.toLowerCase(Locale.ENGLISH);
        String noWhitespace = WHITESPACE.matcher(lowercase).replaceAll("-");
        String noNonLatin = NON_LATIN.matcher(noWhitespace).replaceAll("");
        String noEdgesDashes = EDGES_DASHES.matcher(noNonLatin).replaceAll("");

        return noEdgesDashes.replaceAll("-{2,}", "-");
    }

    public static String toCode(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }

        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String withoutAccents = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String uppercase = withoutAccents.toUpperCase(Locale.ENGLISH);
        String noWhitespace = WHITESPACE.matcher(uppercase).replaceAll("_");
        String noNonLatin = NON_LATIN.matcher(noWhitespace).replaceAll("");

        return noNonLatin.replaceAll("_{2,}", "_");
    }
}
