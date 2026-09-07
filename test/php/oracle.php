<?php
require __DIR__.'/vendor/autoload.php';
$twig = new Twig\Environment(new Twig\Loader\ArrayLoader(), ['autoescape' => false]);
function tokens($twig, $source) {
    $stream = $twig->tokenize(new Twig\Source($source, 'fixture'));
    $result = [];
    while (!$stream->isEOF()) {
        $token = $stream->next();
        if ($token->getType() !== Twig\Token::TEXT_TYPE) $result[] = [$token->getType(), $token->getValue()];
    }
    return $result;
}
$results = [];
foreach (json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR) as $case) {
    try {
        $result = ['id' => $case['id'], 'before' => tokens($twig, $case['source']), 'after' => tokens($twig, $case['formatted'])];
        if (isset($case['contexts'])) {
            $result['renders'] = [];
            foreach ($case['contexts'] as $context) {
                $result['renders'][] = [
                    $twig->createTemplate($case['source'])->render($context),
                    $twig->createTemplate($case['formatted'])->render($context),
                ];
            }
        }
        $results[] = $result;
    } catch (Throwable $e) { $results[] = ['id' => $case['id'], 'error' => $e->getMessage()]; }
}
echo json_encode($results, JSON_THROW_ON_ERROR);
